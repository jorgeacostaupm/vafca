import { nanoid, type PayloadAction } from '@reduxjs/toolkit'

import type { CatalogNetworkPrunePayload } from '@/store/slices/dataset/utils/catalogNetworkPruning'
import type { Annotation, SelectedLink, VisualizationUiState } from '@/types/visualizationUi'

import { createAnnotation } from './annotationDefaults'

const currentAnnotation = (state: VisualizationUiState) => state.annotations.find(item => item.id === state.currentAnnotationId)!
const validColor = (color: string) => /^#[0-9a-f]{6}$/i.test(color)
type SelectedLinkIndexState = {
  selectedLinks: SelectedLink[]
  selectedLinksById: Record<string, SelectedLink>
  selectedLinkIdsByRowId: Record<string, string[]>
}

const indexSelectedLink = (
  state: SelectedLinkIndexState,
  link: SelectedLink,
) => {
  state.selectedLinksById[link.id] = link
  const rowIds = state.selectedLinkIdsByRowId[link.rowId] ?? []
  rowIds.push(link.id)
  state.selectedLinkIdsByRowId[link.rowId] = rowIds
}

const rebuildSelectedLinkIndex = (state: SelectedLinkIndexState) => {
  state.selectedLinksById = {}
  state.selectedLinkIdsByRowId = {}
  state.selectedLinks.forEach((link) => indexSelectedLink(state, link))
}

const removeSelectedLinkIdsFromIndex = (
  state: SelectedLinkIndexState,
  ids: Set<string>,
) => {
  const affectedRowIds = new Set<string>()

  ids.forEach((id) => {
    const link = state.selectedLinksById[id]
    if (!link) return
    delete state.selectedLinksById[id]
    affectedRowIds.add(link.rowId)
  })

  affectedRowIds.forEach((rowId) => {
    const rowIds = state.selectedLinkIdsByRowId[rowId]?.filter(
      (id) => !ids.has(id),
    )
    if (rowIds?.length) {
      state.selectedLinkIdsByRowId[rowId] = rowIds
      return
    }
    delete state.selectedLinkIdsByRowId[rowId]
  })
}

export const annotationReducers = {
    createNewAnnotation: {
      prepare: (details?: Pick<Annotation, 'name' | 'description' | 'color'>) => ({ payload: { id: nanoid(), details } }),
      reducer(state: VisualizationUiState, action: PayloadAction<{ id: string; details?: Pick<Annotation, 'name' | 'description' | 'color'> }>) {
        const { id, details } = action.payload
        if (details && (!details.name.trim() || !validColor(details.color))) return
        state.annotations.push({ ...createAnnotation(id, `Annotation ${state.annotations.length + 1}`), ...details, name: details?.name.trim() || `Annotation ${state.annotations.length + 1}` })
        state.currentAnnotationId = id
        state.activeAnnotationId = id
      },
    },
    toggleActiveAnnotation(state: VisualizationUiState, action: PayloadAction<string>) {
      if (state.annotations.some(item => item.id === action.payload))
        state.activeAnnotationId = state.activeAnnotationId === action.payload ? null : action.payload
    },
    selectAnnotation(state: VisualizationUiState, action: PayloadAction<string>) {
      if (state.annotations.some(item => item.id === action.payload)) state.currentAnnotationId = action.payload
    },
    updateAnnotation(state: VisualizationUiState, action: PayloadAction<{ id: string; name?: string; description?: string; color?: string; active?: boolean }>) {
      const item = state.annotations.find(item => item.id === action.payload.id)
      if (!item) return
      const { name, description, color, active } = action.payload
      if (name?.trim()) item.name = name.trim()
      if (description !== undefined) item.description = description
      if (color && validColor(color)) item.color = color
      if (active !== undefined) item.active = active
    },
    removeAnnotation(state: VisualizationUiState, action: PayloadAction<string>) {
      if (state.annotations.length === 1) return
      state.annotations = state.annotations.filter(item => item.id !== action.payload)
      if (state.activeAnnotationId === action.payload) state.activeAnnotationId = null
      if (state.currentAnnotationId === action.payload) state.currentAnnotationId = state.annotations.at(-1)!.id
    },
    toggleAnnotationNode(state: VisualizationUiState, action: PayloadAction<{ id: string; label: string; annotationId?: string }>) {
      const item = state.annotations.find(item => item.id === (action.payload.annotationId ?? state.activeAnnotationId))
      if (!item) return
      if (item.nodes.some(node => node.id === action.payload.id)) item.nodes = item.nodes.filter(node => node.id !== action.payload.id)
      else item.nodes.push({ id: action.payload.id, label: action.payload.label })
    },
    setAnnotationOverlapColor(state: VisualizationUiState, action: PayloadAction<string>) {
      if (validColor(action.payload)) state.annotationOverlapColor = action.payload
    },
    addSelectedLink(ui: VisualizationUiState, action: PayloadAction<SelectedLink>) {
      const state = ui.annotations.find(item => item.id === ui.activeAnnotationId)
      if (!state) return
      if (state.selectedLinksById[action.payload.id] || state.selectedLinksById[`${action.payload.colId}::${action.payload.rowId}`]) {
        return
      }
      state.selectedLinks.push(action.payload)
      indexSelectedLink(state, action.payload)
    },
    addSelectedLinks(ui: VisualizationUiState, action: PayloadAction<SelectedLink[] | { annotationId: string; links: SelectedLink[] }>) {
      const payload = action.payload
      const state = Array.isArray(payload) ? ui.annotations.find(item => item.id === ui.activeAnnotationId) : ui.annotations.find(item => item.id === payload.annotationId)
      if (!state) return
      const links = Array.isArray(payload) ? payload : payload.links
      links.forEach((link) => {
        if (state.selectedLinksById[link.id] || state.selectedLinksById[`${link.colId}::${link.rowId}`]) return
        state.selectedLinks.push(link)
        indexSelectedLink(state, link)
      })
    },
    removeSelectedLink(ui: VisualizationUiState, action: PayloadAction<string>) {
      const state = currentAnnotation(ui)
      const ids = new Set([action.payload])
      state.selectedLinks = state.selectedLinks.filter((link) => !ids.has(link.id))
      state.atlasLinkIds = state.atlasLinkIds.filter((id) => !ids.has(id))
      removeSelectedLinkIdsFromIndex(state, ids)
    },
    removeSelectedLinks(ui: VisualizationUiState, action: PayloadAction<string[] | { annotationId: string; ids: string[] }>) {
      const payload = action.payload
      const state = Array.isArray(payload) ? currentAnnotation(ui) : ui.annotations.find(item => item.id === payload.annotationId)
      if (!state) return
      const ids = new Set(Array.isArray(payload) ? payload : payload.ids)
      state.selectedLinks = state.selectedLinks.filter((link) => !ids.has(link.id))
      state.atlasLinkIds = state.atlasLinkIds.filter((id) => !ids.has(id))
      removeSelectedLinkIdsFromIndex(state, ids)
    },
    clearSelectedLinks(ui: VisualizationUiState) {
      const state = currentAnnotation(ui)
      state.selectedLinks = []
      state.selectedLinksById = {}
      state.selectedLinkIdsByRowId = {}
      state.atlasLinkIds = []
      ui.selectedLinksDownloadStatus = 'idle'
      ui.selectedLinksDownloadError = null
    },
    pruneSelectedLinksForDisabledCatalogItem(
      ui: VisualizationUiState,
      action: PayloadAction<CatalogNetworkPrunePayload>,
    ) {
      for (const state of ui.annotations) {
      const invalidCompoundIds = new Set(action.payload.invalidCompoundIds)
      state.selectedLinks = state.selectedLinks
        .map((link) => ({
          ...link,
          sources: link.sources.filter(
            (source) => !invalidCompoundIds.has(source.compoundId),
          ),
        }))
        .filter((link) => link.sources.length > 0)
      rebuildSelectedLinkIndex(state)
      const selectedLinkIds = new Set(state.selectedLinks.map((link) => link.id))
      state.atlasLinkIds = state.atlasLinkIds.filter((id) => selectedLinkIds.has(id))
      }
    },
    setAtlasLinkIds(ui: VisualizationUiState, action: PayloadAction<string[]>) {
      const state = currentAnnotation(ui)
      const linkIds = new Set(state.selectedLinks.map((link) => link.id))
      state.atlasLinkIds = Array.from(new Set(action.payload)).filter((id) =>
        linkIds.has(id),
      )
    },
    toggleAtlasLinkId(ui: VisualizationUiState, action: PayloadAction<string>) {
      const state = currentAnnotation(ui)
      const id = action.payload
      if (state.atlasLinkIds.includes(id)) {
        state.atlasLinkIds = state.atlasLinkIds.filter((linkId) => linkId !== id)
        return
      }
      state.atlasLinkIds.push(id)
    },
    clearAtlasLinkIds(ui: VisualizationUiState) {
      const state = currentAnnotation(ui)
      state.atlasLinkIds = []
    },
}
