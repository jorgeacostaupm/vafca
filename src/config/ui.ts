import type { UiRangeMode } from '@/types/connectivityBundle'
import type { NetworkMatrixSelectorMode, NetworkViewType } from '@/types/networkVisualization'
import type { LinkCollectionRankingMode, RankingTarget, RankingTopN } from '@/types/rankings'
import { noCompactor } from 'react-grid-layout'

// Shared visualization UI state.
export const DEFAULT_UI_RANGE_MODE: UiRangeMode = 'logical_default'

// Atlas panel defaults.
export const DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT = 520

// Network visualization state defaults.
export const DEFAULT_NETWORK_VIEW_TYPE: NetworkViewType = 'circular'
export const DEFAULT_NETWORK_MATRIX_SELECTOR_MODE: NetworkMatrixSelectorMode = 'combined'
export const DEFAULT_NETWORK_SYNC_ZOOM = false
export const DEFAULT_NETWORK_HIDE_ISOLATED_NODES = true
export const DEFAULT_NETWORK_NEXT_VIEW_SEQ = 1

// Network panel layout defaults.
export const DEFAULT_NETWORK_PANEL_LAYOUT = {
  width: 8,
  height: 5,
  initialX: 0,
  initialY: 0,
} as const

// Shared panel grid defaults.
export const DEFAULT_PANEL_GRID_CONFIG = {
  columns: 24,
  rowHeight: 100,
  margin: [10, 10] as [number, number],
  bottomBufferRows: 4,
} as const

export const DEFAULT_PANEL_GRID_DRAG_HANDLE = '.panel-card-handle'
export const DEFAULT_PANEL_GRID_COMPACTOR = {
  ...noCompactor,
  preventCollision: true,
} as const

// Ranking tab and ranking query defaults.
export const DEFAULT_NETWORK_VISUALIZATION_TAB = 'views'
export const DEFAULT_RANKING_TARGET: RankingTarget = 'links'
export const DEFAULT_RANKING_TOP_N: RankingTopN = 50
export const DEFAULT_LINK_COLLECTION_RANKING_MODE: LinkCollectionRankingMode = 'aggregated'
export const DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS = false
export const DEFAULT_ROI_RANKING_ALLOW_AUTOCONNECTIONS = false
export const RANKING_TOP_N_OPTIONS = [10, 25, 50, 100, 250, 500] as const

// Ranking result panel layout defaults.
export const DEFAULT_RANKING_PANEL_LAYOUT = {
  width: 16,
  height: 6,
  initialX: 0,
  initialY: 0,
} as const

// Network settings modal defaults.
export const DEFAULT_NETWORK_SETTINGS_TAB = 'views'
export const DEFAULT_HIERARCHY_SETTINGS_TAB = 'configuration'
export const DEFAULT_NETWORK_EDGE_FILTER_TAB = 'roi'

// Data and calculation modal defaults.
export const DEFAULT_DATA_MANAGEMENT_TAB = 'load'
export const DEFAULT_CATALOG_MANAGEMENT_TAB = 'populations'
export const DEFAULT_DERIVED_MATRIX_CALCULATION_TAB = 'comparison'
export const DEFAULT_CONNECTIVITY_IMPORT_MODE = 'lenient'
export const MAX_VISIBLE_IMPORT_ISSUES = 5

// Circular view defaults.
export const DEFAULT_CIRCULAR_LINK_TENSION = 0.85
export const DEFAULT_CIRCULAR_BUNDLING_ENABLED = true
export const CIRCULAR_PREVIEW_FAKE_LINK_DENSITY = 0.02
export const CIRCULAR_NODE_RADIUS = 5
export const CIRCULAR_NODE_HOVER_RADIUS_OFFSET = 2
export const CIRCULAR_LABEL_FONT_SIZE = 11
export const CIRCULAR_LABEL_OFFSET = 8
export const CIRCULAR_LABEL_DY = 4
export const CIRCULAR_TOOLTIP_OFFSET = 18
export const CIRCULAR_TOOLTIP_EDGE_PADDING = 10

// Node-link view defaults.
export const NODE_LINK_NODE_RADIUS = 5
export const NODE_LINK_ZOOM_RADIUS_OFFSET = 1.5
export const NODE_LINK_NODE_HOVER_RADIUS_OFFSET = 2.5
export const NODE_LINK_LABEL_FONT_SIZE = 11
export const NODE_LINK_LABEL_OFFSET = 10
export const NODE_LINK_LABEL_DY = 4
export const NODE_LINK_LAYOUT_MARGIN = 20
export const NODE_LINK_LAYOUT_MIN_LINK_DISTANCE = 36
export const NODE_LINK_LAYOUT_MAX_LINK_DISTANCE = 130
export const NODE_LINK_LAYOUT_BOUNDARY_STRENGTH = 0.18
export const NODE_LINK_LAYOUT_BOUNDARY_DAMPING = 0.35
export const NODE_LINK_LAYOUT_ELLIPSE_INSET = 0.96
export const NODE_LINK_LAYOUT_MIN_ITERATIONS = 160
export const NODE_LINK_LAYOUT_MAX_ITERATIONS = 420
