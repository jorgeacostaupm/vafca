import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import {
  cloneMatrixColorSettings,
  resetMatrixScaleInteractionColors,
} from '@/config/matrixColorScales'
import type { CatalogNetworkPrunePayload } from '@/store/slices/dataset/utils/catalogNetworkPruning'
import type { ScaleType, UiRangeMode } from '@/types/network'
import type {
  AtlasPanelState,
  HoveredCell,
  SelectedLink,
} from '@/types/visualizationUi'

import { downloadSelectedLinks } from './thunks/downloadSelectedLinks'
import { initialVisualizationUiState } from './visualizationUiTypes'

const visualizationUiSlice = createSlice({
  name: 'visualizationUi',
  initialState: initialVisualizationUiState,
  reducers: {
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
    addSelectedLink(state, action: PayloadAction<SelectedLink>) {
      if (state.selectedLinks.some((link) => link.id === action.payload.id)) {
        return
      }
      state.selectedLinks.push(action.payload)
    },
    addSelectedLinks(state, action: PayloadAction<SelectedLink[]>) {
      const selectedIds = new Set(state.selectedLinks.map((link) => link.id))
      action.payload.forEach((link) => {
        if (selectedIds.has(link.id)) return
        selectedIds.add(link.id)
        state.selectedLinks.push(link)
      })
    },
    removeSelectedLink(state, action: PayloadAction<string>) {
      state.selectedLinks = state.selectedLinks.filter(
        (link) => link.id !== action.payload,
      )
      state.atlasLinkIds = state.atlasLinkIds.filter((id) => id !== action.payload)
    },
    removeSelectedLinks(state, action: PayloadAction<string[]>) {
      const ids = new Set(action.payload)
      state.selectedLinks = state.selectedLinks.filter((link) => !ids.has(link.id))
      state.atlasLinkIds = state.atlasLinkIds.filter((id) => !ids.has(id))
    },
    clearSelectedLinks(state) {
      state.selectedLinks = []
      state.atlasLinkIds = []
      state.selectedLinksDownloadStatus = 'idle'
      state.selectedLinksDownloadError = null
    },
    pruneSelectedLinksForDisabledCatalogItem(
      state,
      action: PayloadAction<CatalogNetworkPrunePayload>,
    ) {
      const invalidCompoundIds = new Set(action.payload.invalidCompoundIds)
      state.selectedLinks = state.selectedLinks
        .map((link) => ({
          ...link,
          sources: link.sources.filter(
            (source) => !invalidCompoundIds.has(source.compoundId),
          ),
        }))
        .filter((link) => link.sources.length > 0)
      const selectedLinkIds = new Set(state.selectedLinks.map((link) => link.id))
      state.atlasLinkIds = state.atlasLinkIds.filter((id) => selectedLinkIds.has(id))
    },
    setAtlasLinkIds(state, action: PayloadAction<string[]>) {
      const linkIds = new Set(state.selectedLinks.map((link) => link.id))
      state.atlasLinkIds = Array.from(new Set(action.payload)).filter((id) =>
        linkIds.has(id),
      )
    },
    toggleAtlasLinkId(state, action: PayloadAction<string>) {
      const id = action.payload
      if (state.atlasLinkIds.includes(id)) {
        state.atlasLinkIds = state.atlasLinkIds.filter((linkId) => linkId !== id)
        return
      }
      state.atlasLinkIds.push(id)
    },
    clearAtlasLinkIds(state) {
      state.atlasLinkIds = []
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
    applyMatrixColorSettings(state) {
      state.matrixColorSettings.applied = cloneMatrixColorSettings(
        state.matrixColorSettings.draft,
      )
    },
    resetDraftMatrixColorSettings(state) {
      state.matrixColorSettings.draft = cloneMatrixColorSettings(
        state.matrixColorSettings.applied,
      )
    },
    setAtlasPanelState(state, action: PayloadAction<Partial<AtlasPanelState>>) {
      state.atlasPanel = { ...state.atlasPanel, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
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
  setDraftMatrixInteractionColor,
  setNodeLinkInteractionColor,
  applyMatrixColorSettings,
  resetDraftMatrixColorSettings,
  setAtlasPanelState,
} = visualizationUiSlice.actions

export default visualizationUiSlice.reducer
