import type { D3GroupingPaletteKey } from "@/config/groupingPalettes";

export type AtlasMeshMode = "with_mesh_points" | "without_mesh_points";

export type AtlasTagValue = string | number | boolean | null;

export type AtlasRoiCoords = {
  x: number;
  y: number;
  z: number;
  space?: string;
};

export type AtlasRoi = {
  index: number;
  id: string;
  atlasId: string | number;
  name: string;
  label: string;
  tags: Record<string, AtlasTagValue>;
  coords?: AtlasRoiCoords | null;
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
  rois: AtlasRoi[];
};

export type AtlasSource = {
  atlas: AtlasDefinition;
  fileName: string;
};

export type AtlasLabel = {
  id: string;
  label: string;
  acronym?: string;
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
