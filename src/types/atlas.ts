export type AtlasMeshMode = "with_mesh_points" | "without_mesh_points";

export type AtlasRoi = {
  id: string | number;
  label?: string;
  name?: string;
  mesh_points?: number[][];
  [key: string]: unknown;
};

export type AtlasDefinition = {
  id: string;
  name?: string;
  description?: string;
  rois: AtlasRoi[];
};

export type AtlasSource = {
  atlas: AtlasDefinition;
  fileName: string;
  meshMode: AtlasMeshMode;
};

export type D3CategoricalPaletteKey =
  | "category10"
  | "tableau10"
  | "accent"
  | "dark2"
  | "paired"
  | "pastel1"
  | "pastel2"
  | "set1"
  | "set2"
  | "set3";

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
  colorPalette: D3CategoricalPaletteKey;
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
