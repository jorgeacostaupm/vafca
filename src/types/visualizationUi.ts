import type { UiRangeMode } from "@/types/connectivityBundle";

export type HoveredCell =
  | {
      rowId: string;
      colId: string;
    }
  | null;

export type SelectedLink = {
  id: string;
  rowId: string;
  colId: string;
  rowLabel: string;
  colLabel: string;
  sources: Array<{
    compoundId: string;
    matrixLabel: string;
    value: number;
  }>;
};

export type AtlasPanelState = {
  query: string;
  groupByFields: string[];
  selectedFilters: Record<string, string>;
  collapsedGroups: string[];
  viewerHeight: number;
};

export type VisualizationUiState = {
  hoveredCell: HoveredCell;
  hoveredNodeId: string | null;
  selectedLinks: SelectedLink[];
  atlasLinkIds: string[];
  selectedLinksDownloadStatus: "idle" | "loading" | "ready" | "error";
  selectedLinksDownloadError: string | null;
  uiRangeMode: UiRangeMode;
  atlasPanel: AtlasPanelState;
};
