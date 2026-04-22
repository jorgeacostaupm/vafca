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
