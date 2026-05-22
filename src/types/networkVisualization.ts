import type { UiRangeMode } from "@/types/connectivityBundle";
import type { MatrixValueRange, StatRangeValue } from "@/types/matrixView";

export type NetworkViewType = "matrix" | "circular" | "classic";
export type ViewLoadStatus = "formatting" | "ready" | "error";

export type ZoomSelection = {
  rows: string[];
  cols: string[];
} | null;

export type ZoomableViewSettings = {
  statRange?: StatRangeValue;
  zoomLabelSelection?: string[];
  zoomHistory?: ZoomSelection[];
  zoomIndex?: number;
};

export type ZoomState = {
  history: ZoomSelection[];
  index: number;
  current: ZoomSelection;
};

export type SharedNetworkViewSettings = {
  labels?: string[];
  statRange?: StatRangeValue;
  measureRange?: [number, number];
  hideIsolatedNodes?: boolean;
  zoomLabelSelection?: string[];
  zoomHistory?: ZoomSelection[];
  zoomIndex?: number;
  useAsNodeFilter?: boolean;
  useAsLinkFilter?: boolean;
};

export type MatrixNetworkViewSettings = SharedNetworkViewSettings & {
  brushEnabled?: boolean;
};

export type NodeLinkNetworkViewSettings = SharedNetworkViewSettings & {
  brushEnabled?: boolean;
  geometricZoomEnabled?: boolean;
  linkWidthRange?: [number, number];
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
};

export type NetworkViewDescriptor = {
  id: string;
  type: NetworkViewType;
  compoundId: string;
  label: string;
  measureId: string;
  statId: string;
  status: ViewLoadStatus;
  error?: string;
};

export type NetworkPanelLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type NetworkSelectorControlsState = {
  viewType: NetworkViewType;
  populationKey: string;
  measureId: string;
  statId: string;
  bandId: string;
  selectedCompoundId: string;
  syncZoom: boolean;
  hideIsolatedNodes: boolean;
  circularLinkTension: number;
  circularBundlingEnabled: boolean;
};

export type ViewVisibility = {
  nodeIds: Set<string>;
  linkIds: Set<string>;
};

export type FilterContributor = {
  viewId: string;
};

export type CanonicalMatrixData = {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
};

export type AdaptedMatrixViewData = CanonicalMatrixData;

export type AdaptedNodeLinkViewData = {
  data: number[][];
  labels: string[];
};

export type ComputedView = {
  view: NetworkViewDescriptor;
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  settings?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings;
  zoomState: ZoomState;
  availableLabels: string[];
  selectedLabels: string[];
  zoomLabelSelection: string[];
  orderedZoomLabels: string[];
  statFilter: MatrixValueRange;
  measureRange: [number, number] | null;
  hideIsolatedNodes: boolean;
  brushEnabled: boolean;
  geometricZoomEnabled: boolean;
  linkWidthRange: [number, number];
  circularLinkTension: number;
  circularBundlingEnabled: boolean;
  useAsNodeFilter: boolean;
  useAsLinkFilter: boolean;
  isRangeFilterSource: boolean;
  statSliderMin: number;
  statSliderMax: number;
  hasNegativeRange: boolean;
  uiRangeMode: UiRangeMode;
  includeDiagonalInRanges: boolean;
  statRangeValue?:
    | MatrixNetworkViewSettings["statRange"]
    | NodeLinkNetworkViewSettings["statRange"];
};

export const isNodeLinkViewType = (
  type: NetworkViewType,
): type is "circular" | "classic" => type !== "matrix";
