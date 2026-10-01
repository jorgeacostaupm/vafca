import type * as THREE from 'three';

export interface SpatialManifest {
  version: 1;
  coordinate_space?: string;
  atlas?: {
    type: 'surface-atlas';
    format: 'glb';
    file: string;
    mapping: { roi_field: string; model_field: 'name' };
  };
}

export interface SpatialState {
  resourceId: string;
  manifest: SpatialManifest;
  matchedRois: number;
  missingRois: string[];
  unmatchedModelObjects: string[];
  warnings: string[];
  mappingValues: Record<string, string | number | boolean>;
  anchors: Record<string, [number, number, number]>;
}

export interface LoadedSpatialAtlas {
  root: THREE.Object3D;
  roiObjects: Map<string, THREE.Object3D>;
  manifest: SpatialManifest;
  unmatchedRois: string[];
  unmatchedModelObjects: string[];
}
