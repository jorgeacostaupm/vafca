import { getCompactor } from 'react-grid-layout'

import type { MatrixBrushMode } from '@/types/matrixHeatmap'
import type { UiRangeMode } from '@/types/network'
import type { NetworkSummaryFieldId } from '@/types/networkMeasures'
import type { NetworkMatrixSelectorMode, NetworkViewType } from '@/types/networkVisualization'
import type { LinkCollectionRankingMode, RankingTarget, RankingTopN } from '@/types/rankings'

// Shared visualization UI state.
export const DEFAULT_UI_RANGE_MODE: UiRangeMode = 'view_observed'

// Atlas panel defaults.
export const DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT = 520
export const DEFAULT_ATLAS_PANEL_3D_AVAILABLE = false
export const DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS = [] as const
export const ATLAS_PANEL_ALL_FILTER = '__all__'
export const ATLAS_PANEL_VIEWER_MIN_HEIGHT = 420

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

// Ranking tab and ranking query defaults.
export const DEFAULT_NETWORK_VISUALIZATION_TAB = 'views'
export const DEFAULT_RANKING_TARGET: RankingTarget = 'links'
export const DEFAULT_RANKING_TOP_N: RankingTopN = 50
export const DEFAULT_LINK_COLLECTION_RANKING_MODE: LinkCollectionRankingMode = 'aggregated'
export const DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS = false
export const DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS = false
export const RANKING_TOP_N_OPTIONS = [10, 25, 50, 100, 250, 500] as const

// Network summary defaults.
export const DEFAULT_NETWORK_SUMMARY_INCLUDE_DIAGONAL = false
export const DEFAULT_NETWORK_SUMMARY_INCLUDE_ZERO_EDGES = true
export const DEFAULT_NETWORK_SUMMARY_TOP_ITEMS_LIMIT = 10
export const DEFAULT_NETWORK_SUMMARY_SETTINGS_MODAL_WIDTH = 820
export const NETWORK_SUMMARY_TOP_ITEMS_LIMIT_OPTIONS = [5, 10, 20, 50] as const
export const NETWORK_SUMMARY_FIELD_GROUPS: Array<{
  key: string
  label: string
  fields: Array<{ id: NetworkSummaryFieldId; label: string }>
}> = [
  {
    key: 'identity',
    label: 'Identity',
    fields: [
      { id: 'identity.networkId', label: 'Network ID' },
      { id: 'identity.label', label: 'Network label' },
      { id: 'identity.kind', label: 'Network type' },
      { id: 'identity.measure', label: 'Measure' },
      { id: 'identity.statistic', label: 'Statistic' },
      { id: 'identity.layer', label: 'Layer' },
      { id: 'identity.population', label: 'Population' },
      { id: 'identity.dataSize', label: 'Data size' },
      { id: 'identity.nodeCount', label: 'Nodes' },
      { id: 'identity.symmetric', label: 'Symmetric' },
      { id: 'identity.directed', label: 'Directed' },
      { id: 'identity.networkKind', label: 'Network kind' },
      { id: 'identity.scope', label: 'Scope' },
    ],
  },
  {
    key: 'coverage',
    label: 'Coverage and density',
    fields: [
      { id: 'coverage.nodeCount', label: 'Nodes' },
      { id: 'coverage.possibleEdgeCount', label: 'Possible links' },
      { id: 'coverage.evaluatedEdgeCount', label: 'Evaluated links' },
      { id: 'coverage.usedEdgeCount', label: 'Used links' },
      { id: 'coverage.invalidEdgeCount', label: 'Invalid links' },
      { id: 'coverage.zeroEdgeCount', label: 'Zero links' },
      { id: 'coverage.density', label: 'Density' },
      { id: 'coverage.sparsity', label: 'Sparsity' },
      { id: 'coverage.positiveEdgePercent', label: 'Positive links' },
      { id: 'coverage.negativeEdgePercent', label: 'Negative links' },
      { id: 'coverage.zeroEdgePercent', label: 'Zero links percent' },
    ],
  },
  {
    key: 'weights',
    label: 'Weight distribution',
    fields: [
      { id: 'weights.min', label: 'Min' },
      { id: 'weights.max', label: 'Max' },
      { id: 'weights.mean', label: 'Mean' },
      { id: 'weights.median', label: 'Median' },
      { id: 'weights.standardDeviation', label: 'Standard deviation' },
      { id: 'weights.meanAbs', label: 'Mean absolute' },
      { id: 'weights.sum', label: 'Sum' },
      { id: 'weights.sumAbs', label: 'Absolute sum' },
      { id: 'weights.sumPositive', label: 'Positive sum' },
      { id: 'weights.sumNegative', label: 'Negative sum' },
      { id: 'weights.percentile05', label: 'P05' },
      { id: 'weights.percentile25', label: 'P25' },
      { id: 'weights.percentile50', label: 'P50' },
      { id: 'weights.percentile75', label: 'P75' },
      { id: 'weights.percentile95', label: 'P95' },
    ],
  },
  {
    key: 'global',
    label: 'Global network measures',
    fields: [
      { id: 'global.meanDegree', label: 'Mean degree' },
      { id: 'global.maxDegree', label: 'Max degree' },
      { id: 'global.componentCount', label: 'Components' },
      { id: 'global.giantComponentSize', label: 'Giant component size' },
      { id: 'global.giantComponentRatio', label: 'Giant component ratio' },
      { id: 'global.isolatedNodeCount', label: 'Isolated nodes' },
      { id: 'global.meanClustering', label: 'Mean clustering' },
      { id: 'global.transitivity', label: 'Transitivity' },
      { id: 'global.globalEfficiency', label: 'Global efficiency' },
      { id: 'global.averagePathLength', label: 'Average path length' },
      { id: 'global.diameter', label: 'Diameter' },
    ],
  },
  {
    key: 'tables',
    label: 'Tables',
    fields: [
      { id: 'nodes.topByDegree', label: 'Top nodes by degree' },
      { id: 'nodes.isolated', label: 'Isolated nodes' },
      { id: 'links.topAbs', label: 'Top links by absolute value' },
      { id: 'links.topPositive', label: 'Top positive links' },
      { id: 'links.topNegative', label: 'Top negative links' },
      { id: 'groups.summary', label: 'Node group summary' },
    ],
  },
]
export const NETWORK_SUMMARY_FIELD_IDS = NETWORK_SUMMARY_FIELD_GROUPS.flatMap(
  (group) => group.fields.map((field) => field.id),
)
export const DEFAULT_NETWORK_SUMMARY_VIEW_FIELD_IDS: NetworkSummaryFieldId[] = [
  'coverage.nodeCount',
  'coverage.usedEdgeCount',
  'coverage.density',
  'global.meanDegree',
  'global.componentCount',
]

// Ranking result panel layout defaults.
export const DEFAULT_RANKING_PANEL_LAYOUT = {
  width: 16,
  height: 6,
  initialX: 0,
  initialY: 0,
} as const

// Network settings modal defaults.
export const DEFAULT_NETWORK_SETTINGS_TAB = 'views'
export const DEFAULT_NETWORK_SETTINGS_MODAL_WIDTH = 860
export const DEFAULT_NETWORK_SETTINGS_MODAL_TOP = 48
export const DEFAULT_HIERARCHY_SETTINGS_TAB = 'configuration'
export const DEFAULT_NETWORK_EDGE_FILTER_TAB = 'original'
export const MIN_GROUPING_COLOR_PREVIEW_ITEMS = 7
export const CIRCULAR_HIERARCHY_PREVIEW_WIDTH = 390
export const MATRIX_HIERARCHY_PREVIEW_WIDTH = 520
export const MATRIX_HIERARCHY_PREVIEW_HEIGHT = 150
export const GROUPING_HIERARCHY_PREVIEW_HEIGHT = 128
export const GROUPING_MATRIX_HIERARCHY_PREVIEW_WIDTH = 452
export const GROUPING_CIRCULAR_HIERARCHY_PREVIEW_WIDTH = 452

// Data and calculation modal defaults.
export const DEFAULT_DATA_MANAGEMENT_TAB = 'load'
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
