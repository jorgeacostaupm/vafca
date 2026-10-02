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

  sources: Array<{
    compoundId: string;
    networkLabel: string;
    value: number;
  }>;
};

export type AtlasPanelState = {
  hoveredNodeId?: string | null;
  query: string;
  groupByFields: string[];
  groupByFieldsInitialized: boolean;
  selectedFilters: Record<string, string>;
  collapsedGroups: string[];
  nodeVisibilityDraft: Record<string, boolean> | null;
  viewerHeight: number;
  is3dAvailable: boolean;
  showInactiveNodes: boolean;
  spatialMode: "geometry" | "points" | "none";
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
  backgroundColor: {
    applied: string;
    draft: string;
  };
};

export type MatrixVisualStyle = {
  annotationLinkColors?: Record<string, string>;
  annotationNodeColors?: Record<string, string>;
  annotationCellColors?: Record<string, string>;
  highlightColor: string;
  selectionColor: string;
  backgroundColor?: string;
};

export type NodeLinkVisualStyle = MatrixVisualStyle & {
  positiveLinkColor?: string;
  negativeLinkColor?: string;
};

export type SpatialVisualStyle = {
  nodeColor: string;
  divergingNodeColor: string;
  positiveLinkColor: string;
  negativeLinkColor: string;
  neutralLinkColor: string;
};

export type Annotation = {
  id: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  nodes: Array<{ id: string; label: string }>;
  selectedLinks: SelectedLink[];
  selectedLinksById: Record<string, SelectedLink>;
  selectedLinkIdsByRowId: Record<string, string[]>;
  atlasLinkIds: string[];
  atlasNodeIds: string[];
};

export type VisualizationUiState = {
  showGroupingLegend: boolean;
  spatialVisualStyle: SpatialVisualStyle;
  hoveredCell: HoveredCell;
  hoveredNodeId: string | null;
  annotations: Annotation[];
  currentAnnotationId: string;
  activeAnnotationId: string | null;
  annotationOverlapColor: string;
  selectedLinksDownloadStatus: "idle" | "loading" | "ready" | "error";
  selectedLinksDownloadError: string | null;
  uiRangeMode: UiRangeMode;
  matrixColorSettings: MatrixColorSettingsState;
  nodeLinkVisualStyle: NodeLinkVisualStyle;
  circularVisualStyle: NodeLinkVisualStyle;
  atlasPanel: AtlasPanelState;
};
