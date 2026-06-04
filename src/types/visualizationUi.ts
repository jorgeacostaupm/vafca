import type { ScaleType, UiRangeMode } from "@/types/connectivityBundle";

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
    matrixLabel: string;
    value: number;
  }>;
};

export type AtlasPanelState = {
  query: string;
  groupByFields: string[];
  groupByFieldsInitialized: boolean;
  selectedFilters: Record<string, string>;
  collapsedGroups: string[];
  roiVisibilityDraft: Record<string, boolean> | null;
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

export type VisualizationUiState = {
  hoveredCell: HoveredCell;
  hoveredNodeId: string | null;
  selectedLinks: SelectedLink[];
  atlasLinkIds: string[];
  selectedLinksDownloadStatus: "idle" | "loading" | "ready" | "error";
  selectedLinksDownloadError: string | null;
  uiRangeMode: UiRangeMode;
  matrixColorSettings: MatrixColorSettingsState;
  atlasPanel: AtlasPanelState;
};
