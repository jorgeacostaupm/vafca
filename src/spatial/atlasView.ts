import * as THREE from 'three';

import { SPATIAL_ATLAS_CONTEXT_OPACITY, SPATIAL_ATLAS_HOVER_OPACITY } from '@/config/ui';
import { appColors } from '@/theme';

import { disposeSpatialObject } from './disposeSpatialAtlas';
import { getSpatialAtlas } from './loadSpatialAtlas';
import type { SpatialState } from './types';

export function createAtlasView(parent: THREE.Group, spatial?: SpatialState) {
  const source = getSpatialAtlas(spatial);
  const root = source?.root.clone(true) ?? new THREE.Group();
  const meshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>[] = [];
  const roiMeshes = new Map<string, THREE.Mesh>();
  const geometries = new Map<THREE.BufferGeometry, THREE.BufferGeometry>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    // Each view owns its geometry; the loaded dataset remains reusable by other views.
    if (!geometries.has(object.geometry)) geometries.set(object.geometry, object.geometry.clone());
    object.geometry = geometries.get(object.geometry)!;
    object.material = new THREE.MeshStandardMaterial({
      color: appColors.spatialNeutral,
      transparent: true, opacity: SPATIAL_ATLAS_CONTEXT_OPACITY,
      roughness: 1, metalness: 0, flatShading: false,
      depthTest: true, depthWrite: false, side: THREE.FrontSide,
    });
    object.castShadow = false;
    object.receiveShadow = false;
    const id = object.userData.vafcaRoiId as string | undefined;
    if (id) roiMeshes.set(id, object);
    meshes.push(object);
  });
  parent.add(root);
  return {
    root, meshes, roiMeshes,
    update(color: string, hovered: string | null, enabled?: Record<string, boolean>, incident?: ReadonlySet<string>, nodeColors?: Record<string, string>) {
      for (const mesh of meshes) {
        const id = mesh.userData.vafcaRoiId as string | undefined;
        const hoveredActive = Boolean(id && hovered === id);
        const incidentActive = Boolean(id && incident?.has(id));
        if (enabled) mesh.visible = !id || enabled[id] !== false;
        mesh.material.opacity = (id && nodeColors?.[id]) || hoveredActive || incidentActive ? SPATIAL_ATLAS_HOVER_OPACITY : SPATIAL_ATLAS_CONTEXT_OPACITY;
        mesh.material.color.set((id && nodeColors?.[id]) || (incidentActive ? appColors.spatialIncident : hoveredActive ? color : appColors.spatialNeutral));
      }
    },
    dispose() { disposeSpatialObject(root); },
  };
}
