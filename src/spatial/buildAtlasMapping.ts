import * as THREE from 'three';

import type { LoadedSpatialAtlas, SpatialManifest } from './types';

export function buildAtlasMapping(root: THREE.Object3D, manifest: SpatialManifest,
  rois: Array<{ id: string; [key: string]: unknown }>): LoadedSpatialAtlas {
  const roiByKey = new Map<string, (typeof rois)[number]>();
  const field = manifest.atlas!.mapping.roi_field;
  for (const roi of rois) {
    if (!Object.hasOwn(roi, field) || roi[field] == null) continue;
    const value = roi[field];
    if (!['string', 'number', 'boolean'].includes(typeof value)) throw new Error(`Invalid ROI spatial mapping key: ${roi.id}`);
    const key = String(value);
    if (roiByKey.has(key)) throw new Error(`Duplicate ROI spatial mapping key: ${key}`);
    roiByKey.set(key, roi);
  }
  root.traverse(object => { delete object.userData.vafcaRoiId; delete object.userData.nodeId; });
  const roiObjects = new Map<string, THREE.Object3D>();
  root.traverse(object => {
    if (!object.name || !roiByKey.has(object.name)) return;
    if (roiObjects.has(object.name)) throw new Error(`Duplicate atlas object name: ${object.name}`);
    roiObjects.set(object.name, object);
  });
  for (const [key, object] of roiObjects) {
    object.traverse(child => {
      const id = roiByKey.get(key)!.id;
      if (child.userData.vafcaRoiId && child.userData.vafcaRoiId !== id) throw new Error('Overlapping ROI object hierarchies.');
      child.userData.vafcaRoiId = id;
      child.userData.nodeId = id;
    });
  }
  const unmatchedModelObjects: string[] = [];
  root.traverse(object => {
    if (object instanceof THREE.Mesh && !object.userData.vafcaRoiId) unmatchedModelObjects.push(object.name || object.uuid);
  });
  const matched = new Set([...roiObjects.values()].map(object => object.userData.vafcaRoiId));
  return { root, roiObjects, manifest, unmatchedRois: rois.filter(roi => !matched.has(roi.id)).map(roi => roi.id), unmatchedModelObjects };
}
