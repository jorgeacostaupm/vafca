import type { RootState } from '@/types/store'

export const selectVisualizationUiState = (state: RootState) => state.visualizationUi
export const selectHoveredCell = (state: RootState) => state.visualizationUi.hoveredCell
export const selectHoveredNodeId = (state: RootState) =>
  state.visualizationUi.hoveredNodeId
export { selectAtlasLinkIds,selectSelectedLinkIdsByRowId, selectSelectedLinks, selectSelectedLinksById } from './annotationSelectors'
export const selectSelectedLinksDownloadStatus = (state: RootState) =>
  state.visualizationUi.selectedLinksDownloadStatus
export const selectSelectedLinksDownloadError = (state: RootState) =>
  state.visualizationUi.selectedLinksDownloadError
export const selectUiRangeMode = (state: RootState) => state.visualizationUi.uiRangeMode
export const selectAppliedMatrixColorSettings = (state: RootState) =>
  state.visualizationUi.matrixColorSettings.applied
export const selectDraftMatrixColorSettings = (state: RootState) =>
  state.visualizationUi.matrixColorSettings.draft
export const selectAppliedMatrixBackgroundColor = (state: RootState) =>
  state.visualizationUi.matrixColorSettings.backgroundColor.applied
export const selectDraftMatrixBackgroundColor = (state: RootState) =>
  state.visualizationUi.matrixColorSettings.backgroundColor.draft
export const selectNodeLinkVisualStyle = (state: RootState) =>
  state.visualizationUi.nodeLinkVisualStyle
export const selectCircularVisualStyle = (state: RootState) =>
  state.visualizationUi.circularVisualStyle
export const selectAtlasPanelState = (state: RootState) => state.visualizationUi.atlasPanel
