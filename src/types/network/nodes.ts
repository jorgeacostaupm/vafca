export type NodeTagValue = string | number | boolean | null;

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
  index?: number;
  tags: Record<string, NodeTagValue>;
  metadata: Record<string, unknown>;
  coords?: NodeCoordinates | null;
};

export type NodeTerminology = {
  singular: string;
  plural: string;
};

export type NodeSet = {
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
