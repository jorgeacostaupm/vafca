import type { MatrixShape } from "@/types/matrix";
import type { ConnectivityMatrix } from "@/types/matrix";
import type { SelectedLink } from "@/types/visualizationUi";

export type MatrixOption = {
  value: string;
  label: string;
};

export type MatrixColumn = {
  compoundId: string;
  label: string;
};

export type LinkRow = {
  key: string;
  linkLabel: string;
  values: Record<string, number | null>;
};

export type DownloadMode = "all" | "viewer";

export type MatrixCache = Record<string, ConnectivityMatrix | null>;

export type BuildLinkValuesParams = {
  link: SelectedLink;
  layerIds: string[];
  matrixCache: MatrixCache;
  atlasIndex: Map<string, number>;
  matrixShape: MatrixShape;
};

export type BuildRowsParams = {
  links: SelectedLink[];
  selectedMatrixIds: string[];
  matrixCache: MatrixCache;
  atlasIndex: Map<string, number>;
  matrixShape: MatrixShape;
};

export type ExportedLink = {
  id: string;
  rowId: string;
  rowLabel: string;
  colId: string;
  colLabel: string;
  values: Record<string, number | null>;
};

export type SelectedLinksExportPayload = {
  exportedAt: string;
  mode: DownloadMode;
  matrixShape: MatrixShape;
  linksCount: number;
  layersCount: number;
  layers: Array<{
    compoundId: string;
    label: string;
  }>;
  links: ExportedLink[];
};

