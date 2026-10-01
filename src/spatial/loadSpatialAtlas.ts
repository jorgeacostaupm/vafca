import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import type { Node } from '@/types/network';

import { buildAtlasMapping } from './buildAtlasMapping';
import { disposeSpatialObject } from './disposeSpatialAtlas';
import { loadSpatialManifest, spatialPath } from './loadSpatialManifest';
import type { LoadedSpatialAtlas, SpatialState } from './types';

const resources = new Map<string, { atlas: LoadedSpatialAtlas | null; files: Record<string, Uint8Array> }>();
export const getSpatialAtlas = (state?: SpatialState) => state ? resources.get(state.resourceId)?.atlas ?? null : null;
export const getSpatialFiles = (state?: SpatialState) => {
  if (!state) return {};
  const resource = resources.get(state.resourceId);
  if (!resource) throw new Error('Spatial atlas resources are no longer available. Reload the dataset before exporting.');
  return resource.files;
};
export function releaseSpatialAtlas(id: string) {
  const resource = resources.get(id);
  if (resource?.atlas) { disposeSpatialObject(resource.atlas.root); resource.atlas.roiObjects.clear(); }
  resources.delete(id);
}

export async function loadSpatialAtlas(files: Record<string, Uint8Array>, nodes: Node[], rawRois: unknown): Promise<SpatialState | undefined> {
  const manifest = loadSpatialManifest(files);
  if (!manifest) return undefined;
  const state: SpatialState = { resourceId: crypto.randomUUID(), manifest, matchedRois: 0, missingRois: [], unmatchedModelObjects: [], warnings: [], mappingValues: {}, anchors: {} };
  const spatialFiles = { 'spatial/manifest.json': files['spatial/manifest.json'] };
  if (!manifest.atlas) { resources.set(state.resourceId, { atlas: null, files: spatialFiles }); return state; }
  if (!Array.isArray(rawRois)) throw new Error('Spatial atlas requires rois.json.');
  const path = spatialPath(manifest.atlas.file);
  // ponytail: initially only GLB; external resources must be packaged in the GLB, never fetched from arbitrary URLs.
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(url => {
    if (!url.startsWith('blob:') && !url.startsWith('data:')) throw new Error('GLB external resources are unsupported; embed them in the model.');
    return url;
  });
  const gltf = await new GLTFLoader(manager).parseAsync(new Uint8Array(files[path]).buffer, '');
  try {
    // GLTFLoader sanitizes/uniquifies names for animation bindings; mapping uses the declared model names.
    gltf.scene.traverse(object => {
      const index = gltf.parser.associations.get(object)?.nodes;
      const name: unknown = index === undefined ? undefined : gltf.parser.json.nodes?.[index]?.name;
      if (typeof name === 'string') object.name = name;
    });
    const atlas = buildAtlasMapping(gltf.scene, manifest, rawRois);
    atlas.root.updateMatrixWorld(true);
    const objectsById = new Map([...atlas.roiObjects.values()].map(object => [object.userData.vafcaRoiId, object]));
    state.mappingValues = Object.fromEntries(rawRois.flatMap(roi => {
      const value = roi[manifest.atlas!.mapping.roi_field];
      return value == null ? [] : [[roi.id, value]];
    }));
    state.matchedRois = objectsById.size;
    state.missingRois = atlas.unmatchedRois;
    state.unmatchedModelObjects = atlas.unmatchedModelObjects;
    if (atlas.unmatchedRois.length) state.warnings.push(`${atlas.unmatchedRois.length} ROIs do not have atlas geometry: ${atlas.unmatchedRois.join(', ')}`);
    if (atlas.unmatchedModelObjects.length) state.warnings.push(`Atlas objects without a corresponding ROI: ${atlas.unmatchedModelObjects.join(', ')}`);
    for (const node of nodes) {
      if (node.coords) {
        if (manifest.coordinate_space && node.coords.space && manifest.coordinate_space !== node.coords.space) {
          const warning = `Spatial coordinate-space mismatch: atlas = ${manifest.coordinate_space}, nodes = ${node.coords.space}`;
          if (!state.warnings.includes(warning)) state.warnings.push(warning);
        }
        continue;
      }
      const object = objectsById.get(node.id);
      const box = object ? new THREE.Box3().setFromObject(object) : null;
      if (box && !box.isEmpty()) {
        state.anchors[node.id] = box.getCenter(new THREE.Vector3()).toArray();
        state.warnings.push(`${node.id}: missing coordinates; using geometry bounding-box center as a visual fallback.`);
      } else state.warnings.push(`${node.id}: no coordinates or usable geometry; no spatial anchor.`);
    }
    resources.set(state.resourceId, { atlas, files: { ...spatialFiles, [path]: files[path] } });
    return state;
  } catch (error) { disposeSpatialObject(gltf.scene); throw error; }
}
