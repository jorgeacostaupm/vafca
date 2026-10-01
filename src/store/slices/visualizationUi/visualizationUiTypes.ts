import {
  cloneMatrixColorSettings,
  DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
  DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
  DEFAULT_MATRIX_COLOR_SETTINGS,
} from '@/config/matrixColorScales'
import {
  DEFAULT_ATLAS_PANEL_3D_AVAILABLE,
  DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS,
  DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT,
  DEFAULT_MATRIX_BACKGROUND_COLOR,
  DEFAULT_UI_RANGE_MODE,
} from '@/config/ui'
import { appColors } from '@/theme'
import type { VisualizationUiState } from '@/types/visualizationUi'

import { createAnnotation, DEFAULT_ANNOTATION_OVERLAP_COLOR } from './annotationDefaults'

export type VisualizationUiSliceState = VisualizationUiState

export const initialAtlasPanelState: VisualizationUiSliceState['atlasPanel'] = {
  query: '',
  groupByFields: [...DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS],
  groupByFieldsInitialized: false,
  selectedFilters: {},
  collapsedGroups: [],
  nodeVisibilityDraft: null,
  showInactiveNodes: false,
  viewerHeight: DEFAULT_ATLAS_PANEL_VIEWER_HEIGHT,
  is3dAvailable: DEFAULT_ATLAS_PANEL_3D_AVAILABLE,
  spatialMode: DEFAULT_ATLAS_PANEL_3D_AVAILABLE ? "geometry" : "none",
}

export const initialVisualizationUiState: VisualizationUiSliceState = {
  spatialVisualStyle: { nodeColor: appColors.spatialNode, divergingNodeColor: appColors.spatialDivergingNode, positiveLinkColor: appColors.networkLinkPositive, negativeLinkColor: appColors.networkLinkNegative, neutralLinkColor: appColors.spatialNeutral },
  hoveredCell: null,
  hoveredNodeId: null,
  annotations: [createAnnotation('default', 'Annotation 1')],
  currentAnnotationId: 'default',
  activeAnnotationId: 'default',
  annotationOverlapColor: DEFAULT_ANNOTATION_OVERLAP_COLOR,
  selectedLinksDownloadStatus: 'idle',
  selectedLinksDownloadError: null,
  uiRangeMode: DEFAULT_UI_RANGE_MODE,
  matrixColorSettings: {
    applied: cloneMatrixColorSettings(DEFAULT_MATRIX_COLOR_SETTINGS),
    draft: cloneMatrixColorSettings(DEFAULT_MATRIX_COLOR_SETTINGS),
    backgroundColor: {
      applied: DEFAULT_MATRIX_BACKGROUND_COLOR,
      draft: DEFAULT_MATRIX_BACKGROUND_COLOR,
    },
  },
  nodeLinkVisualStyle: {
    positiveLinkColor: DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
    negativeLinkColor: DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
    highlightColor: appColors.visualHighlight,
    selectionColor: appColors.visualSelection,
  },
  circularVisualStyle: {
    highlightColor: appColors.visualHighlight,
    selectionColor: appColors.visualSelection,
  },
  atlasPanel: initialAtlasPanelState,
}
