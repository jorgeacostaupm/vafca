import * as THREE from 'three';

import { ATLAS_POINT_RADIUS_RATIO, ATLAS_POINT_SEGMENTS, ATLAS_SCENE_SPAN } from '@/config/ui';
import { getSpatialAtlas } from '@/spatial/loadSpatialAtlas';
import type { SpatialState } from '@/spatial/types';
import type { AtlasNode } from '@/types/atlas';
import type { AtlasPanelState } from '@/types/visualizationUi';

export const getSpatialNodeCenter = (node: AtlasNode, spatial?: SpatialState): number[] | null => {
  if (node.coords && [node.coords.x, node.coords.y, node.coords.z].every(Number.isFinite)) {
    return [node.coords.x, node.coords.y, node.coords.z];
  }
  return spatial?.anchors[node.id] ?? null;
};

export function spatialBounds(nodes: AtlasNode[], spatial?: SpatialState) {
  const root = getSpatialAtlas(spatial)?.root;
  const bounds = root ? new THREE.Box3().setFromObject(root) : new THREE.Box3();
  for (const node of nodes) {
    const point = getSpatialNodeCenter(node, spatial);
    if (point) bounds.expandByPoint(new THREE.Vector3(...point));
  }
  const size = bounds.getSize(new THREE.Vector3());
  return { origin: bounds.getCenter(new THREE.Vector3()), span: Math.max(size.x, size.y, size.z) || 1 };
}

export function orientSpatialGroup(group: THREE.Group, nodes: AtlasNode[], spatial?: SpatialState) {
  const { origin, span } = spatialBounds(nodes, spatial);
  const scale = ATLAS_SCENE_SPAN / span;
  group.scale.setScalar(scale);
  group.position.copy(origin).multiplyScalar(-scale);
}

export const createSpatialGeometryBuilder = (nodes: AtlasNode[], mode: AtlasPanelState['spatialMode'], spatial?: SpatialState) => {
  const { span } = spatialBounds(nodes, spatial);
  return (node: AtlasNode) => {
    if (mode === 'none') return null;
    const rawCenter = getSpatialNodeCenter(node, spatial);
    if (!rawCenter) return null;
    const center = new THREE.Vector3(...rawCenter);
    const geometry = new THREE.SphereGeometry(span * ATLAS_POINT_RADIUS_RATIO, ATLAS_POINT_SEGMENTS, ATLAS_POINT_SEGMENTS);
    geometry.translate(center.x, center.y, center.z);
    return { geometry, center };
  };
};
