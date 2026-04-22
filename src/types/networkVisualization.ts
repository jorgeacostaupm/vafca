import type { StatRangeValue } from "@/types/matrixView";

export type NetworkViewType = "matrix" | "circular" | "classic";
export type LogicalMode = "and" | "or";
export type ViewLoadStatus = "formatting" | "ready" | "error";

export type ZoomSelection = {
  rows: string[];
  cols: string[];
} | null;

export type SharedNetworkViewSettings = {
  labels?: string[];
  statRange?: StatRangeValue;
  measureRange?: [number, number];
  hideIsolatedNodes?: boolean;
  zoomLabelSelection?: string[];
  zoomHistory?: ZoomSelection[];
  zoomIndex?: number;
  useAsNodeFilter?: boolean;
  nodeFilterMode?: LogicalMode;
  useAsLinkFilter?: boolean;
  linkFilterMode?: LogicalMode;
};

export type MatrixNetworkViewSettings = SharedNetworkViewSettings & {
  brushEnabled?: boolean;
};

export type NodeLinkNetworkViewSettings = SharedNetworkViewSettings & {
  brushEnabled?: boolean;
  geometricZoomEnabled?: boolean;
  linkWidthRange?: [number, number];
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
};

export const isNodeLinkViewType = (
  type: NetworkViewType,
): type is "circular" | "classic" => type !== "matrix";
