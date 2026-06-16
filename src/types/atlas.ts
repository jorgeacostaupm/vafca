import type { D3GroupingPaletteKey } from "@/config/groupingPalettes";
import type { NodeCoordinates, NodeTagValue } from "@/types/network";

export type AtlasNode = {
  index: number;
  id: string;
  atlasId: string | number;
  name: string;
  label: string;
  tags: Record<string, NodeTagValue>;
  coords?: NodeCoordinates | null;
  metadata?: Record<string, unknown>;
  mesh_points?: number[][];
};

export type AtlasDefinition = {
  id: string;
  name: string;
  description?: string;
  version?: string;
  space?: string;
  coordinateSystem?: string;
  nodes: AtlasNode[];
};

export type AtlasSource = {
  atlas: AtlasDefinition;
  fileName: string;
};

export type AtlasLabel = {
  id: string;
  label: string;
  name?: string;
  acronym?: string;
  tags?: Record<string, NodeTagValue>;
  metadata?: Record<string, unknown>;
  enabled: boolean;
};

export type AtlasState = {
  order: string[];
  labelsById: Record<string, AtlasLabel>;
  initialized: boolean;
  colorFields: string[];
  colorPalette: D3GroupingPaletteKey;
  circularHierarchyFields: string[];
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyFields: string[];
  matrixHierarchyCategoryOrder: Record<string, string[]>;
};

export type AtlasDefinitionState = {
  uploaded: AtlasSource | null;
};

export type AtlasValidationSuccess = {
  ok: true;
  atlas: AtlasDefinition;
  commonFields: string[];
};

export type AtlasValidationError = {
  ok: false;
  error: string;
};

export type AtlasValidationResult = AtlasValidationSuccess | AtlasValidationError;
