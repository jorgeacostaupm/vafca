import {
  cloneMatrixColorSettings,
  DEFAULT_MATRIX_COLOR_SETTINGS,
} from '@/config/matrixColorScales'
import {
  DEFAULT_ATLAS_PANEL_3D_AVAILABLE,
  DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS,
  DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT,
  DEFAULT_NODE_LINK_HIGHLIGHT_COLOR,
  DEFAULT_NODE_LINK_SELECTION_COLOR,
  DEFAULT_UI_RANGE_MODE,
} from '@/config/ui'
import type { VisualizationUiState } from '@/types/visualizationUi'

export type VisualizationUiSliceState = VisualizationUiState

export const initialAtlasPanelState: VisualizationUiSliceState['atlasPanel'] = {
  query: '',
  groupByFields: [...DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS],
  groupByFieldsInitialized: false,
  selectedFilters: {},
  collapsedGroups: [],
  nodeVisibilityDraft: null,
  viewerHeight: DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT,
  is3dAvailable: DEFAULT_ATLAS_PANEL_3D_AVAILABLE,
}

export const initialVisualizationUiState: VisualizationUiSliceState = {
  hoveredCell: null,
  hoveredNodeId: null,
  selectedLinks: [],
  atlasLinkIds: [],
  selectedLinksDownloadStatus: 'idle',
  selectedLinksDownloadError: null,
  uiRangeMode: DEFAULT_UI_RANGE_MODE,
  matrixColorSettings: {
    applied: cloneMatrixColorSettings(DEFAULT_MATRIX_COLOR_SETTINGS),
    draft: cloneMatrixColorSettings(DEFAULT_MATRIX_COLOR_SETTINGS),
  },
  nodeLinkVisualStyle: {
    highlightColor: DEFAULT_NODE_LINK_HIGHLIGHT_COLOR,
    selectionColor: DEFAULT_NODE_LINK_SELECTION_COLOR,
  },
  atlasPanel: initialAtlasPanelState,
}
