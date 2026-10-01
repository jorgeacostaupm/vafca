import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  cloneMatrixColorSettings,
  resetMatrixScaleInteractionColors,
} from '@/config/matrixColorScales'
import { setLabelsEnabled } from '@/store/slices/atlasUi/atlasUiSlice'
import type { ScaleType, UiRangeMode } from '@/types/network'
import type {
  AtlasPanelState,
  HoveredCell,
  SpatialVisualStyle,
} from '@/types/visualizationUi'

import { annotationReducers } from './annotationReducers'
import { downloadSelectedLinks } from './thunks/downloadSelectedLinks'
import { initialVisualizationUiState } from './visualizationUiTypes'

const visualizationUiSlice = createSlice({
  name: 'visualizationUi',
  initialState: initialVisualizationUiState,
  reducers: {
    ...annotationReducers,
    setSpatialVisualStyle(state, action: PayloadAction<SpatialVisualStyle>) {
      state.spatialVisualStyle = action.payload
    },
    setHoveredCell(state, action: PayloadAction<NonNullable<HoveredCell>>) {
      if (
        state.hoveredCell?.rowId === action.payload.rowId &&
        state.hoveredCell?.colId === action.payload.colId &&
        !state.hoveredNodeId
      ) {
        return
      }
      state.hoveredCell = action.payload
      state.hoveredNodeId = null
    },
    clearHoveredCell(state) {
      if (!state.hoveredCell) return
      state.hoveredCell = null
    },
    setHoveredNode(state, action: PayloadAction<string>) {
      if (state.hoveredNodeId === action.payload && !state.hoveredCell) return
      state.hoveredNodeId = action.payload
      state.hoveredCell = null
    },
    clearHoveredNode(state) {
      if (!state.hoveredNodeId) return
      state.hoveredNodeId = null
    },
    setUiRangeMode(state, action: PayloadAction<UiRangeMode>) {
      state.uiRangeMode = action.payload
    },
    setDraftMatrixColorScale(
      state,
      action: PayloadAction<{ scaleType: ScaleType; scaleId: string }>,
    ) {
      const { scaleType, scaleId } = action.payload
      state.matrixColorSettings.draft[scaleType] = resetMatrixScaleInteractionColors(
        {
          ...state.matrixColorSettings.draft[scaleType],
          scaleId,
        },
        scaleType,
      )
    },
    setDraftMatrixColorDiscretize(
      state,
      action: PayloadAction<{ scaleType: ScaleType; discretize: boolean }>,
    ) {
      const { scaleType, discretize } = action.payload
      state.matrixColorSettings.draft[scaleType].discretize = discretize
    },
    setDraftMatrixColorInvert(
      state,
      action: PayloadAction<{ scaleType: ScaleType; invert: boolean }>,
    ) {
      const { scaleType, invert } = action.payload
      state.matrixColorSettings.draft[scaleType].invert = invert
    },
    setDraftMatrixColorDiscreteSteps(
      state,
      action: PayloadAction<{ scaleType: ScaleType; discreteSteps: number }>,
    ) {
      const { scaleType, discreteSteps } = action.payload
      state.matrixColorSettings.draft[scaleType].discreteSteps = discreteSteps
    },
    setDraftMatrixInteractionColor(
      state,
      action: PayloadAction<{
        scaleType: ScaleType
        colorRole: 'highlight' | 'selection'
        color: string
      }>,
    ) {
      const { scaleType, colorRole, color } = action.payload
      if (colorRole === 'highlight') {
        state.matrixColorSettings.draft[scaleType].highlightColor = color
        return
      }
      state.matrixColorSettings.draft[scaleType].selectionColor = color
    },
    setDraftMatrixBackgroundColor(state, action: PayloadAction<string>) {
      state.matrixColorSettings.backgroundColor.draft = action.payload
    },
    setNodeLinkInteractionColor(
      state,
      action: PayloadAction<{
        colorRole: 'highlight' | 'selection'
        color: string
      }>,
    ) {
      const { colorRole, color } = action.payload
      if (colorRole === 'highlight') {
        state.nodeLinkVisualStyle.highlightColor = color
        return
      }
      state.nodeLinkVisualStyle.selectionColor = color
    },
    setNodeLinkLinkColor(
      state,
      action: PayloadAction<{
        colorRole: 'positive' | 'negative'
        color: string
      }>,
    ) {
      const { colorRole, color } = action.payload
      if (colorRole === 'positive') {
        state.nodeLinkVisualStyle.positiveLinkColor = color
        return
      }
      state.nodeLinkVisualStyle.negativeLinkColor = color
    },
    setCircularInteractionColor(
      state,
      action: PayloadAction<{
        colorRole: 'highlight' | 'selection'
        color: string
      }>,
    ) {
      const { colorRole, color } = action.payload
      if (colorRole === 'highlight') {
        state.circularVisualStyle.highlightColor = color
        return
      }
      state.circularVisualStyle.selectionColor = color
    },
    applyMatrixColorSettings(state) {
      state.matrixColorSettings.applied = cloneMatrixColorSettings(
        state.matrixColorSettings.draft,
      )
      state.matrixColorSettings.backgroundColor.applied =
        state.matrixColorSettings.backgroundColor.draft
    },
    resetDraftMatrixColorSettings(state) {
      state.matrixColorSettings.draft = cloneMatrixColorSettings(
        state.matrixColorSettings.applied,
      )
      state.matrixColorSettings.backgroundColor.draft =
        state.matrixColorSettings.backgroundColor.applied
    },
    setAtlasPanelState(state, action: PayloadAction<Partial<AtlasPanelState>>) {
      state.atlasPanel = { ...state.atlasPanel, ...action.payload }
      if (action.payload.spatialMode !== undefined) {
        state.atlasPanel.is3dAvailable = action.payload.spatialMode !== 'none'
      } else if (action.payload.is3dAvailable !== undefined) {
        state.atlasPanel.spatialMode = action.payload.is3dAvailable ? 'geometry' : 'none'
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(setLabelsEnabled, (state, { payload }) => {
        const draft = state.atlasPanel.nodeVisibilityDraft
        if (!draft) return
        for (const id of payload.ids) {
          if (id in draft) draft[id] = payload.enabled
        }
      })
      .addCase(downloadSelectedLinks.pending, (state) => {
        state.selectedLinksDownloadStatus = 'loading'
        state.selectedLinksDownloadError = null
      })
      .addCase(downloadSelectedLinks.fulfilled, (state) => {
        state.selectedLinksDownloadStatus = 'ready'
        state.selectedLinksDownloadError = null
      })
      .addCase(downloadSelectedLinks.rejected, (state, action) => {
        state.selectedLinksDownloadStatus = 'error'
        state.selectedLinksDownloadError =
          action.payload ?? action.error.message ?? 'Failed to download selected links.'
      })
  },
})

export const {
  toggleActiveAnnotation, createNewAnnotation, selectAnnotation, updateAnnotation, removeAnnotation, toggleAnnotationNode, setAnnotationOverlapColor,
  setSpatialVisualStyle,
  setHoveredCell,
  clearHoveredCell,
  setHoveredNode,
  clearHoveredNode,
  addSelectedLink,
  addSelectedLinks,
  removeSelectedLink,
  removeSelectedLinks,
  clearSelectedLinks,
  pruneSelectedLinksForDisabledCatalogItem,
  setAtlasLinkIds,
  toggleAtlasLinkId,
  clearAtlasLinkIds,
  setUiRangeMode,
  setDraftMatrixColorScale,
  setDraftMatrixColorDiscretize,
  setDraftMatrixColorInvert,
  setDraftMatrixColorDiscreteSteps,
  setDraftMatrixBackgroundColor,
  setDraftMatrixInteractionColor,
  setCircularInteractionColor,
  setNodeLinkInteractionColor,
  setNodeLinkLinkColor,
  applyMatrixColorSettings,
  resetDraftMatrixColorSettings,
  setAtlasPanelState,
} = visualizationUiSlice.actions

export default visualizationUiSlice.reducer
