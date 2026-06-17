import type { MaterializedNetworkView } from "@/types/datasetNetworkView";
import type { SelectedLink } from "@/types/visualizationUi";

export type NetworkOption = {
  value: string;
  label: string;
};

export type NetworkColumn = {
  compoundId: string;
  label: string;
};

export type LinkRow = {
  key: string;
  linkLabel: string;
  values: Record<string, number | null>;
};

export type DownloadMode = "all" | "viewer";

export type NetworkLookup = Record<string, MaterializedNetworkView | null>;

export type BuildLinkValuesParams = {
  link: SelectedLink;
  networkIds: string[];
  networkLookup: NetworkLookup;
  atlasIndex: Map<string, number>;
};

export type BuildRowsParams = {
  links: SelectedLink[];
  selectedNetworkIds: string[];
  networkLookup: NetworkLookup;
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
  networksCount: number;
  networks: Array<{
    compoundId: string;
    label: string;
  }>;
  links: ExportedLink[];
};
