import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'

import type { RootState } from '@/types/store'

export const selectAnnotations = (state: RootState) => state.visualizationUi.annotations
export const selectCurrentAnnotation = (state: RootState) => state.visualizationUi.annotations.find(item => item.id === state.visualizationUi.currentAnnotationId)!
export const selectSelectedLinks = (state: RootState) => selectCurrentAnnotation(state).selectedLinks
export const selectSelectedLinksById = (state: RootState) => selectCurrentAnnotation(state).selectedLinksById
export const selectSelectedLinkIdsByRowId = (state: RootState) => selectCurrentAnnotation(state).selectedLinkIdsByRowId
export const selectAtlasLinkIds = (state: RootState) => selectCurrentAnnotation(state).atlasLinkIds
export const selectAnnotationColors = createSelector(
  [selectAnnotations, (state: RootState) => state.visualizationUi.annotationOverlapColor],
  (annotations, overlapColor) => {
    const links: Record<string, string> = {}, nodes: Record<string, string> = {}
    for (const annotation of annotations) {
      if (!annotation.active) continue
      const seen = new Set<string>()
      for (const link of annotation.selectedLinks) {
        for (const key of [`${link.rowId}::${link.colId}`, `${link.colId}::${link.rowId}`]) {
          if (seen.has(key)) continue
          seen.add(key)
          links[key] = links[key] ? overlapColor : annotation.color
        }
      }
      for (const node of annotation.nodes) nodes[node.id] = nodes[node.id] ? overlapColor : annotation.color
    }
    return { links, nodes }
  },
)
export const selectVisibleAnnotationLinks = createSelector([selectAnnotations], annotations =>
  Object.fromEntries(annotations.filter(item => item.active).flatMap(item => item.selectedLinks.map(link => [link.id, link]))))

// Preserve each color map when only the other kind of annotation changes.
export const selectAnnotationLinkColors = createSelector([selectAnnotationColors], colors => colors.links,
  { memoizeOptions: { resultEqualityCheck: shallowEqual } })
export const selectAnnotationNodeColors = createSelector([selectAnnotationColors], colors => colors.nodes,
  { memoizeOptions: { resultEqualityCheck: shallowEqual } })

export const selectActiveAnnotation = (state: RootState) => state.visualizationUi.annotations.find(item => item.id === state.visualizationUi.activeAnnotationId)
const emptyLinks: import('@/types/visualizationUi').SelectedLink[] = []
const emptyLinkIndex: Record<string, import('@/types/visualizationUi').SelectedLink> = {}
export const selectActiveAnnotationLinks = (state: RootState) => selectActiveAnnotation(state)?.selectedLinks ?? emptyLinks
export const selectActiveAnnotationLinksById = (state: RootState) => selectActiveAnnotation(state)?.selectedLinksById ?? emptyLinkIndex
