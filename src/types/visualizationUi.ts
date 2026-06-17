import type { ScaleType, UiRangeMode } from "@/types/network";

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
  directed?: boolean;
  sources: Array<{
    compoundId: string;
    networkLabel: string;
    value: number;
  }>;
};

export type AtlasPanelState = {
  query: string;
  groupByFields: string[];
  groupByFieldsInitialized: boolean;
  selectedFilters: Record<string, string>;
  collapsedGroups: string[];
  nodeVisibilityDraft: Record<string, boolean> | null;
  viewerHeight: number;
  is3dAvailable: boolean;
};

export type MatrixColorScaleSettings = {
  scaleId: string;
  invert: boolean;
  discretize: boolean;
  discreteSteps: number;
  highlightColor: string;
  selectionColor: string;
};

export type MatrixColorSettings = Record<ScaleType, MatrixColorScaleSettings>;

export type MatrixColorSettingsState = {
  applied: MatrixColorSettings;
  draft: MatrixColorSettings;
};

export type MatrixVisualStyle = {
  highlightColor: string;
  selectionColor: string;
};

export type NodeLinkVisualStyle = MatrixVisualStyle;

export type VisualizationUiState = {
  hoveredCell: HoveredCell;
  hoveredNodeId: string | null;
  selectedLinks: SelectedLink[];
  selectedLinksById: Record<string, SelectedLink>;
  selectedLinkIdsByRowId: Record<string, string[]>;
  atlasLinkIds: string[];
  selectedLinksDownloadStatus: "idle" | "loading" | "ready" | "error";
  selectedLinksDownloadError: string | null;
  uiRangeMode: UiRangeMode;
  matrixColorSettings: MatrixColorSettingsState;
  nodeLinkVisualStyle: NodeLinkVisualStyle;
  atlasPanel: AtlasPanelState;
};
