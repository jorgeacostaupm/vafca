import { getCompactor } from 'react-grid-layout'

import type { MatrixBrushMode } from '@/types/matrixHeatmap'
import type { UiRangeMode } from '@/types/network'
import type { NetworkMatrixSelectorMode, NetworkViewType } from '@/types/networkVisualization'
import type { LinkCollectionRankingMode, RankingTarget, RankingTopN } from '@/types/rankings'

// Shared visualization UI state.
export const DEFAULT_UI_RANGE_MODE: UiRangeMode = 'view_observed'

// Root app navigation.
export const DEFAULT_APP_SECTION = 'vis'
export const APP_NAV_RAIL_WIDTH = 64

// Atlas panel defaults.
export const DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT = 520
export const DEFAULT_ATLAS_PANEL_3D_AVAILABLE = false
export const DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS = [] as const
export const ATLAS_PANEL_ALL_FILTER = '__all__'
export const ATLAS_PANEL_VIEWER_MIN_HEIGHT = 420
export const DEFAULT_ATLAS_MANAGEMENT_TAB = 'current'

// Network visualization state defaults.
export const DEFAULT_NETWORK_VIEW_TYPE: NetworkViewType = 'matrix'
export const DEFAULT_NETWORK_MATRIX_SELECTOR_MODE: NetworkMatrixSelectorMode = 'combined'
export const DEFAULT_NETWORK_SYNC_ZOOM = false
export const DEFAULT_NETWORK_HIDE_ISOLATED_NODES = true
export const DEFAULT_NETWORK_SELECTION_VISIBLE = true
export const DEFAULT_NETWORK_PERCENT_ZOOM_INCLUDE_AUTOCONNECTIONS = false
export const DEFAULT_NETWORK_PERCENT_ZOOM_PERCENT = 10
export const MIN_NETWORK_PERCENT_ZOOM_PERCENT = 1
export const MAX_NETWORK_PERCENT_ZOOM_PERCENT = 100
export const DEFAULT_NETWORK_NEXT_VIEW_SEQ = 1
export const DEFAULT_MATRIX_BRUSH_MODE: MatrixBrushMode = 'zoom'
export const DEFAULT_MATRIX_COLOR_DISCRETE_STEPS = 7
export const MIN_MATRIX_COLOR_DISCRETE_STEPS = 3
export const MAX_MATRIX_COLOR_DISCRETE_STEPS = 12
export const MATRIX_COLOR_PREVIEW_HEIGHT = 44
export const MATRIX_COLOR_PREVIEW_HORIZONTAL_PADDING = 18
export const MATRIX_COLOR_PREVIEW_MIN_LENGTH = 140
export const MATRIX_COLOR_LEGEND_THICKNESS = 10
export const MATRIX_COLOR_LEGEND_VERTICAL_OFFSET = 16
export const DEFAULT_NODE_LINK_HIGHLIGHT_COLOR = '#d64545'
export const DEFAULT_NODE_LINK_SELECTION_COLOR = '#f0b429'

// Matrix overlay defaults.
export const MATRIX_HOVER_AXIS_GAP = 1.2
export const MATRIX_HOVER_AXIS_STROKE = 1.6
export const MATRIX_SELECTED_CELL_INSET = 0.6
export const MATRIX_SELECTED_CELL_ACCENT_STROKE = 2
export const MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE = 750
export const MATRIX_BRUSH_LINK_DISPATCH_YIELD_MS = 0

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
export const DEFAULT_PANEL_GRID_COMPACTOR = getCompactor('vertical', false, true)
export const DEFAULT_RESIZABLE_CONTAINER_DEBOUNCE_MS = 100
export const SHARED_HOVER_GRAPH_SYNC_THROTTLE_MS = 48

// Selected links table defaults.
export const SELECTED_LINKS_TABLE_FALLBACK_HEADER_HEIGHT = 40
export const SELECTED_LINKS_TABLE_FALLBACK_PAGINATION_HEIGHT = 40
export const SELECTED_LINKS_TABLE_FALLBACK_ROW_HEIGHT = 39

// Ranking tab and ranking query defaults.
export const DEFAULT_NETWORK_VISUALIZATION_TAB = 'views'
export const DEFAULT_RANKING_TARGET: RankingTarget = 'links'
export const DEFAULT_RANKING_TOP_N: RankingTopN = 50
export const DEFAULT_LINK_COLLECTION_RANKING_MODE: LinkCollectionRankingMode = 'aggregated'
export const DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS = false
export const DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS = false
export const RANKING_TOP_N_OPTIONS = [10, 25, 50, 100, 250, 500] as const

// Ranking result panel layout defaults.
export const DEFAULT_RANKING_PANEL_LAYOUT = {
  width: 16,
  height: 6,
  initialX: 0,
  initialY: 0,
} as const

// Selected links table defaults.
export const SELECTED_LINKS_TABLE_DEFAULT_PAGE_SIZE = 25
export const SELECTED_LINKS_TABLE_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Network settings modal defaults.
export const DEFAULT_NETWORK_SETTINGS_TAB = 'networks'
export const DEFAULT_NETWORK_SETTINGS_MODAL_WIDTH = 860
export const DEFAULT_NETWORK_SETTINGS_MODAL_TOP = 48
export const DEFAULT_ATLAS_MANAGEMENT_MODAL_WIDTH = 760
export const DEFAULT_ATLAS_SETTINGS_MODAL_WIDTH = 720
export const DEFAULT_ATLAS_MODAL_TOP = 48
export const DEFAULT_NETWORK_EDGE_FILTER_TAB = 'original'
export const MIN_GROUPING_COLOR_PREVIEW_ITEMS = 7
export const CIRCULAR_HIERARCHY_PREVIEW_WIDTH = 390
export const MATRIX_HIERARCHY_PREVIEW_WIDTH = 520
export const MATRIX_HIERARCHY_PREVIEW_HEIGHT = 150
export const GROUPING_HIERARCHY_PREVIEW_HEIGHT = 128
export const GROUPING_MATRIX_HIERARCHY_PREVIEW_WIDTH = 452
export const GROUPING_CIRCULAR_HIERARCHY_PREVIEW_WIDTH = 452

// Data and calculation modal defaults.
export const DEFAULT_DATA_MANAGEMENT_TAB = 'current'
export const DEFAULT_CATALOG_MANAGEMENT_TAB = 'populations'
export const DEFAULT_DERIVED_MATRIX_CALCULATION_TAB = 'comparison'
export const DEFAULT_NETWORK_IMPORT_MODE = 'lenient'
export const MAX_VISIBLE_IMPORT_ISSUES = 5

// Circular view defaults.
export const DEFAULT_CIRCULAR_LINK_TENSION = 0.85
export const DEFAULT_CIRCULAR_BUNDLING_ENABLED = true
export const CIRCULAR_PREVIEW_FAKE_LINK_DENSITY = 0.02
export const CIRCULAR_LAYOUT_EDGE_PADDING = 10
export const CIRCULAR_NODE_RADIUS = 5
export const CIRCULAR_NODE_HOVER_RADIUS_OFFSET = 2
export const CIRCULAR_LABEL_FONT_SIZE = 11
export const CIRCULAR_LABEL_FALLBACK_CHAR_WIDTH_RATIO = 0.58
export const CIRCULAR_LABEL_OFFSET = 8
export const CIRCULAR_LABEL_DY = 4
export const CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_X = 3
export const CIRCULAR_LABEL_SELECTION_BACKGROUND_PADDING_Y = 1.5
export const CIRCULAR_LABEL_SELECTION_BACKGROUND_RADIUS = 2
export const CIRCULAR_TOOLTIP_OFFSET = 18
export const CIRCULAR_TOOLTIP_EDGE_PADDING = 10
export const CIRCULAR_BRUSH_LINK_SAMPLE_COUNT = 96

// Node-link view defaults.
export const DEFAULT_LINK_WIDTH_RANGE: [number, number] = [0.6, 2.6]
export const NETWORK_LINK_SELECTED_OPACITY = 0.9
export const NODE_LINK_LINK_OPACITY = 0.55
export const CIRCULAR_LINK_OPACITY = 0.6
export const NODELINK_TOOLTIP_OFFSET = 12
export const NETWORK_LINK_SELECTED_MIN_STROKE = 2.4
export const NODE_LINK_NODE_RADIUS = 5
export const NODE_LINK_ZOOM_RADIUS_OFFSET = 1.5
export const NODE_LINK_NODE_HOVER_RADIUS_OFFSET = 2.5
export const NODE_LINK_LABEL_FONT_SIZE = 11
export const NODE_LINK_LABEL_OFFSET = 10
export const NODE_LINK_LABEL_DY = 4
export const NODE_LINK_LABEL_SELECTION_BACKGROUND_PADDING_X = 3
export const NODE_LINK_LABEL_SELECTION_BACKGROUND_PADDING_Y = 1.5
export const NODE_LINK_LABEL_SELECTION_BACKGROUND_RADIUS = 2
export const NODE_LINK_LAYOUT_MARGIN = 20
export const NODE_LINK_LAYOUT_MIN_LINK_DISTANCE = 36
export const NODE_LINK_LAYOUT_MAX_LINK_DISTANCE = 130
export const NODE_LINK_LAYOUT_BOUNDARY_STRENGTH = 0.18
export const NODE_LINK_LAYOUT_BOUNDARY_DAMPING = 0.35
export const NODE_LINK_LAYOUT_ELLIPSE_INSET = 0.96
export const NODE_LINK_LAYOUT_MIN_ITERATIONS = 160
export const NODE_LINK_LAYOUT_MAX_ITERATIONS = 420
export const NETWORK_LINK_HOVER_STROKE_OFFSET = 2
export const NETWORK_LINK_HOVER_MIN_STROKE = 3
export const NODE_LINK_HIT_STROKE_WIDTH = 10

// Matrix label defaults.
export const MATRIX_LABEL_BACKGROUND_PADDING_X = 2
export const MATRIX_LABEL_BACKGROUND_PADDING_Y = 1
export const MATRIX_LABEL_BACKGROUND_RADIUS = 2
