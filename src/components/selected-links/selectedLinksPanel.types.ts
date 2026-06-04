import type { MatrixViewData } from "@/types/connectivityBundle";
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

export type MatrixLookup = Record<string, MatrixViewData | null>;

export type BuildLinkValuesParams = {
  link: SelectedLink;
  layerIds: string[];
  matrixLookup: MatrixLookup;
  atlasIndex: Map<string, number>;
};

export type BuildRowsParams = {
  links: SelectedLink[];
  selectedMatrixIds: string[];
  matrixLookup: MatrixLookup;
  atlasIndex: Map<string, number>;
};

export type ExportedLink = {
  id: string;
  rowId: string;
  rowLabel: string;
  colId: string;
  colLabel: string;
  directed?: boolean;
  values: Record<string, number | null>;
};

export type SelectedLinksExportPayload = {
  exportedAt: string;
  mode: DownloadMode;
  linksCount: number;
  layersCount: number;
  layers: Array<{
    compoundId: string;
    label: string;
  }>;
  links: ExportedLink[];
};
