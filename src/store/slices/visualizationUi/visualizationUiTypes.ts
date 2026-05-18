import type { VisualizationUiState } from '@/types/visualizationUi'

export type VisualizationUiSliceState = VisualizationUiState

export const initialAtlasPanelState: VisualizationUiSliceState['atlasPanel'] = {
  query: '',
  groupByFields: [],
  selectedFilters: {},
  collapsedGroups: [],
  viewerHeight: 520,
}

export const initialVisualizationUiState: VisualizationUiSliceState = {
  hoveredCell: null,
  hoveredNodeId: null,
  selectedLinks: [],
  atlasLinkIds: [],
  selectedLinksDownloadStatus: 'idle',
  selectedLinksDownloadError: null,
  uiRangeMode: 'logical_default',
  includeDiagonalInRanges: false,
  atlasPanel: initialAtlasPanelState,
}
