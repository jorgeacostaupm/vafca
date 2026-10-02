import type { RootState } from '@/types/store'

export const selectGroupingLegendVisible = (state: RootState) =>
  state.visualizationUi.showGroupingLegend &&
  (state.workspaceUi.activeSection === 'vis' || state.workspaceUi.activeSection === 'atlas')

export {
  selectAtlasLinkIds,
  selectSelectedLinks,
  selectSelectedLinksById,
} from './annotationSelectors'
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
