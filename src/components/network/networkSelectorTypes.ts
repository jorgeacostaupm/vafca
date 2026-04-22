import type { MatrixValueRange } from "@/utils/matrixFiltering";
import type {
  LogicalMode,
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";
import type { getZoomState } from "@/components/selectors/useViewSettingsState";

export type ComputedView = {
  view: NetworkViewDescriptor;
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
  settings?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings;
  zoomState: ReturnType<typeof getZoomState>;
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
  useAsNodeFilter: boolean;
  nodeFilterMode: LogicalMode;
  useAsLinkFilter: boolean;
  linkFilterMode: LogicalMode;
  statSliderMin: number;
  statSliderMax: number;
  hasNegativeRange: boolean;
  measureRangeBounds?: [number, number];
  measureRangeValue?: [number, number];
  statRangeValue?:
    | MatrixNetworkViewSettings["statRange"]
    | NodeLinkNetworkViewSettings["statRange"];
};
