import type { RootState } from '@/types/store'

export const selectNetworkVisualizationState = (state: RootState) =>
  state.networkVisualization
export const selectNetworkControls = (state: RootState) =>
  state.networkVisualization.controls
export const selectNetworkViewsOrder = (state: RootState) =>
  state.networkVisualization.viewsOrder
export const selectNetworkViewsById = (state: RootState) =>
  state.networkVisualization.viewsById
export const selectNetworkLayout = (state: RootState) =>
  state.networkVisualization.layout
