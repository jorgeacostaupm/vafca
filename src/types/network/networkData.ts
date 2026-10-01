export type MatrixLayout = "full" | "upper_triangular" | "lower_triangular";
export type MatrixDtype = "float32" | "float64";
export type MatrixCellValue = number | null;
export type MatrixData = MatrixCellValue[][] | MatrixCellValue[];
export type ValueRange = [number, number];
export type ScaleType = "sequential" | "diverging";
export type RangeMode =
  | "inherit_measure"
  | "non_negative_observed"
  | "observed"
  | "observed_symmetric"
  | "fixed";
export type UiRangeMode = "view_observed" | "shared";

export type NetworkValueDomain = {
  min: number | null;
  max: number | null;
  center: number | null;
  units?: string | null;
};

export type NetworkDataStatsBucket = {
  min: number | null;
  max: number | null;
  absMax: number | null;
  finiteCount: number;
  nullCount: number;
};

export type NetworkDataStats = {
  allValues: NetworkDataStatsBucket;
};

export type MatrixNetworkData = {
  format: "matrix";
  layout: MatrixLayout;
  dtype?: MatrixDtype;
  values: MatrixData;
  missingValue: MatrixCellValue;
};

export type NetworkEdge = {
  sourceId: string;
  targetId: string;
  value: number;
};

export type EdgeListNetworkData = {
  format: "edge-list";
  edges: NetworkEdge[];
};

export type NetworkData = MatrixNetworkData | EdgeListNetworkData;
