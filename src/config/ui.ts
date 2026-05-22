import type { UiRangeMode } from "@/types/connectivityBundle";
import type { NetworkViewType } from "@/types/networkVisualization";

export const DEFAULT_UI_RANGE_MODE: UiRangeMode = "logical_default";
export const DEFAULT_INCLUDE_DIAGONAL_IN_RANGES = false;

export const DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT = 520;

export const DEFAULT_NETWORK_VIEW_TYPE: NetworkViewType = "matrix";
export const DEFAULT_NETWORK_SYNC_ZOOM = false;
export const DEFAULT_NETWORK_HIDE_ISOLATED_NODES = true;
export const DEFAULT_NETWORK_NEXT_VIEW_SEQ = 1;

export const DEFAULT_NETWORK_PANEL_LAYOUT = {
  width: 8,
  height: 5,
  columns: 3,
} as const;

export const DEFAULT_EDGE_FILTER_INCLUDE_DIAGONAL = true;

export const DEFAULT_CIRCULAR_LINK_TENSION = 0.85;
export const DEFAULT_CIRCULAR_BUNDLING_ENABLED = true;
export const CIRCULAR_PREVIEW_FAKE_LINK_DENSITY = 0.02;
