import type { SpatialState } from '@/spatial/types';
export type NodeCoordinates = {
  x: number;
  y: number;
  z: number;
  space?: string;
};

export type Node = {
  id: string;
  label: string;
  name?: string;
  atlasId?: string | number;
  index?: number;

  metadata: Record<string, unknown>;
  coords?: NodeCoordinates | null;
};

export type NodeTerminology = {
  singular: string;
  plural: string;
};

export type NodeSet = {
  spatial?: SpatialState;
  id: string;
  label: string;
  description?: string | null;
  version?: string | null;
  coordinateSystem?: string | null;
  terminology: NodeTerminology;
  nodes: Node[];
};

export type AggregatedNode = Node & {
  sourceNodeIds: string[];
  criteria: Record<string, string>;
};

export type AggregatedNodeSet = Omit<NodeSet, "nodes"> & {
  sourceNodeSetId: string;
  nodes: AggregatedNode[];
};
