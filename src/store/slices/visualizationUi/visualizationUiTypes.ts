import type { VisualizationUiState } from '@/types/visualizationUi'
import {
  DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT,
  DEFAULT_INCLUDE_DIAGONAL_IN_RANGES,
  DEFAULT_UI_RANGE_MODE,
} from '@/config/ui'

export type VisualizationUiSliceState = VisualizationUiState

export const initialAtlasPanelState: VisualizationUiSliceState['atlasPanel'] = {
  query: '',
  groupByFields: [],
  selectedFilters: {},
  collapsedGroups: [],
  viewerHeight: DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT,
}

export const initialVisualizationUiState: VisualizationUiSliceState = {
  hoveredCell: null,
  hoveredNodeId: null,
  selectedLinks: [],
  atlasLinkIds: [],
  selectedLinksDownloadStatus: 'idle',
  selectedLinksDownloadError: null,
  uiRangeMode: DEFAULT_UI_RANGE_MODE,
  includeDiagonalInRanges: DEFAULT_INCLUDE_DIAGONAL_IN_RANGES,
  atlasPanel: initialAtlasPanelState,
}
