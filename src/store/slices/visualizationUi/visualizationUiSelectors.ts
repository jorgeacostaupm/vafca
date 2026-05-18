import type { RootState } from '@/types/store'

export const selectVisualizationUiState = (state: RootState) => state.visualizationUi
export const selectHoveredCell = (state: RootState) => state.visualizationUi.hoveredCell
export const selectHoveredNodeId = (state: RootState) =>
  state.visualizationUi.hoveredNodeId
export const selectSelectedLinks = (state: RootState) =>
  state.visualizationUi.selectedLinks
export const selectAtlasLinkIds = (state: RootState) => state.visualizationUi.atlasLinkIds
export const selectSelectedLinksDownloadStatus = (state: RootState) =>
  state.visualizationUi.selectedLinksDownloadStatus
export const selectSelectedLinksDownloadError = (state: RootState) =>
  state.visualizationUi.selectedLinksDownloadError
export const selectUiRangeMode = (state: RootState) => state.visualizationUi.uiRangeMode
export const selectIncludeDiagonalInRanges = (state: RootState) =>
  state.visualizationUi.includeDiagonalInRanges
export const selectAtlasPanelState = (state: RootState) => state.visualizationUi.atlasPanel
