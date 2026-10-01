import type { AtlasDefinition } from "@/types/atlas";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type { MatrixValueRange, StatRangeValue } from "@/types/matrixView";
import type { NetworkDataStats, NodeGroup, UiRangeMode } from "@/types/network";
import type { ResolvedValueDomain } from "@/types/valueDomain";

export type NetworkViewType = "matrix" | "circular" | "classic";
export type NetworkMatrixSelectorMode = "combined" | "fields";
export type ViewLoadStatus = "formatting" | "ready" | "error";

export type ZoomSelection = {
  rows: string[];
  cols: string[];
  linkIds?: string[];
} | null;

export type NetworkPercentFilterMode =
  | "top"
  | "bottom"
  | "absoluteTop"
  | "absoluteBottom";

export type NetworkPercentLinkFilter = {
  mode: NetworkPercentFilterMode;
  percent: number;
  includeAutoconnections: boolean;
};

export type ZoomableViewSettings = {
  statRange?: StatRangeValue;
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
  zoomHistory?: ZoomSelection[];
  zoomIndex?: number;
  selectionVisible?: boolean;
  zoomLinkPercent?: number;
  percentLinkFilter?: NetworkPercentLinkFilter | null;
  useAsNodeFilter?: boolean;
  useAsLinkFilter?: boolean;
};

export type MatrixNetworkViewSettings = SharedNetworkViewSettings & {
  brushEnabled?: boolean;
  brushMode?: MatrixBrushMode;
};

export type NodeLinkNetworkViewSettings = SharedNetworkViewSettings & {
  brushEnabled?: boolean;
  brushMode?: MatrixBrushMode;
  geometricZoomEnabled?: boolean;
  linkWidthRange?: [number, number];
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
  circularPositiveLinkColor?: string;
  circularNegativeLinkColor?: string;
};

export type NetworkViewDescriptor = {
  id: string;
  type: NetworkViewType;
  compoundId: string;
  temporaryNetworkId?: string;
  coordinationDisabled?: boolean;
  label: string;
  measureId: string;
  statisticId: string;
  status: ViewLoadStatus;
  loadingMessage?: string;
  error?: string;
};

export type TemporaryAggregatedNetwork = {
  id: string;
  sourceViewId: string;
  sourceNetworkLabel: string;
  label: string;
  measureId: string;
  statisticId: string;
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  symmetric: boolean;
  groups: NodeGroup[];
  labelNames: Record<string, string>;
  labelTitles: Record<string, string>;
  labelAcronyms: Record<string, string>;
  nodeColors: Record<string, string>;
  dataStats?: NetworkDataStats;
  createdAt: string;
};

export type NetworkLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type NetworkSelectorControlsState = {
  viewType: NetworkViewType;
  matrixSelectorMode: NetworkMatrixSelectorMode;
  sourceId: string;
  measureId: string;
  statisticId: string;
  aspectFilters: Record<string, string>;
  selectedCompoundId: string;
  syncZoom: boolean;
  hideIsolatedNodes: boolean;
  circularLinkTension: number;
  circularBundlingEnabled: boolean;
  circularPositiveLinkColor: string;
  circularNegativeLinkColor: string;
  percentZoomIncludeAutoconnections: boolean;
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

export type MatrixViewRenderData = CanonicalMatrixData;

export type NodeLinkViewRenderData = {
  data: number[][];
  labels: string[];
};

export type ComputedView = {
  orderingAtlasDefinition?: AtlasDefinition | null;
  inputMatrix: CanonicalMatrixData;
  view: NetworkViewDescriptor;
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  nodeColors?: Record<string, string>;
  symmetric: boolean;
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
  brushMode: MatrixBrushMode;
  geometricZoomEnabled: boolean;
  linkWidthRange: [number, number];
  circularLinkTension: number;
  circularBundlingEnabled: boolean;
  circularPositiveLinkColor: string;
  circularNegativeLinkColor: string;
  selectionVisible: boolean;
  zoomLinkPercent: number;
  percentLinkFilter: NetworkPercentLinkFilter | null;
  useAsNodeFilter: boolean;
  useAsLinkFilter: boolean;
  isRangeFilterSource: boolean;
  valueDomain: ResolvedValueDomain;
  statSliderMin: number;
  statSliderMax: number;
  hasNegativeRange: boolean;
  uiRangeMode: UiRangeMode;
  statRangeValue?:
    | MatrixNetworkViewSettings["statRange"]
    | NodeLinkNetworkViewSettings["statRange"];
};

export const isNodeLinkViewType = (
  type: NetworkViewType,
): type is "circular" | "classic" => type !== "matrix";
