import { createSelector } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'

import { selectAllDatasetNetworks, selectDatasetNodeSet } from '@/store/slices/dataset/datasetSelectors'
import type { AtlasDefinition } from '@/types/atlas'
import type { RootState } from '@/types/store'
import { buildAggregatedNodeColors } from '@/utils/aggregatedNodePresentation'
import { buildNodeGroupingColorById, buildNodeGroupingColorCategories } from '@/utils/groupingColoring'
import { buildLabelNameMap, normalizeNodeOrder } from '@/utils/nodeOrder'
import { orderAtlasLabels } from '@/utils/orderAtlasLabels'

import {
  selectAtlasColorFields, selectAtlasColorPalette, selectAtlasEnabledIds,
  selectAtlasLabelsById, selectAtlasOrder,
} from './atlasUiSelectors'

export const selectDatasetNodeOrder = createSelector([selectDatasetNodeSet], nodeSet =>
  normalizeNodeOrder([...(nodeSet?.nodes ?? [])]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map(node => ({ id: String(node.id), label: node.name ?? node.label,
      name: node.name, acronym: node.label, metadata: node.metadata }))),
)

export const selectDatasetNodeOrderIds = createSelector(
  [selectDatasetNodeOrder], order => order.map(node => node.id),
)

export const selectPresentationAtlasDefinition = createSelector(
  [(state: RootState) => state.atlasDefinition.uploaded?.atlas ??
    (state.dataset.nodeSet ? state.atlasDefinition.defaultById[state.dataset.nodeSet.id] : null),
  selectDatasetNodeSet, selectAtlasOrder, selectAtlasLabelsById],
  (definition, nodeSet, order, labels): AtlasDefinition | null => {
    if (definition || !order.length) return definition ?? null
    return {
      id: nodeSet?.id ?? 'active-atlas', name: nodeSet?.label ?? 'Unknown',
      nodes: order.map((id, index) => {
        const label = labels[id]
        return { index, id, atlasId: id, name: label?.name ?? label?.label ?? id,
          label: label?.acronym ?? label?.label ?? id, metadata: label?.metadata ?? {}, coords: null }
      }),
    }
  },
)

const selectDatasetAggregatedGroups = createSelector([selectAllDatasetNetworks], networks =>
  networks.flatMap(network => network.derivation?.type === 'aggregation' ? network.derivation.groups : []),
  { memoizeOptions: { resultEqualityCheck: shallowEqual } },
)

const selectAllAggregatedGroups = createSelector(
  [selectDatasetAggregatedGroups, (state: RootState) => state.networkVisualization.temporaryNetworksById],
  (groups, temporary) => [...groups, ...Object.values(temporary).flatMap(network => network.groups)],
)

const selectLabelPresentation = createSelector(
  [selectAtlasOrder, selectAtlasLabelsById, selectDatasetNodeOrder, selectDatasetAggregatedGroups],
  (order, labels, nodeOrder, groups) => {
    const names: Record<string, string> = order.length ? {} : buildLabelNameMap(nodeOrder)
    const titles: Record<string, string> = {}
    const acronyms: Record<string, string> = {}
    for (const id of order) {
      const label = labels[id]
      names[id] = label?.acronym?.trim() ?? label?.label?.trim() ?? id
      if (!label) continue
      titles[id] = label.name?.trim() || label.label || id
      acronyms[id] = label.acronym?.trim() ? label.acronym : id
    }
    for (const group of groups) {
      names[group.id] = titles[group.id] = acronyms[group.id] = group.label
    }
    return { labelNames: names, labelTitles: titles, labelAcronyms: acronyms }
  },
)

const selectActiveLabelIds = createSelector(
  [selectAtlasOrder, selectAtlasEnabledIds, selectDatasetNodeOrderIds],
  (order, enabled, nodeIds) => order.length ? enabled : nodeIds,
)

const selectMatrixActiveLabelIds = createSelector(
  [selectActiveLabelIds, selectPresentationAtlasDefinition, selectAtlasOrder,
    (state: RootState) => state.atlasUi.matrixHierarchyFields,
    (state: RootState) => state.atlasUi.matrixHierarchyCategoryOrder],
  (ids, definition, order, fields, categories) =>
    order.length ? orderAtlasLabels(ids, definition, fields, categories) : ids,
)

const selectNodeColors = createSelector(
  [selectPresentationAtlasDefinition, selectAtlasColorFields, selectAtlasColorPalette, selectAllAggregatedGroups],
  (atlasDefinition, groupingFields, colorPalette, groups) => ({
    ...buildNodeGroupingColorById({ atlasDefinition, groupingFields, colorPalette }),
    ...buildAggregatedNodeColors(groups),
  }),
)

const selectGroupingCategories = createSelector(
  [selectPresentationAtlasDefinition, selectAtlasColorFields, selectAtlasColorPalette],
  (atlasDefinition, groupingFields, colorPalette) =>
    buildNodeGroupingColorCategories({ atlasDefinition, groupingFields, colorPalette }),
)

export const selectAtlasPresentation = createSelector(
  [selectPresentationAtlasDefinition, selectDatasetNodeOrderIds,
    (state: RootState, useMatrixHierarchyOrder = false) =>
      useMatrixHierarchyOrder ? selectMatrixActiveLabelIds(state) : selectActiveLabelIds(state),
    selectLabelPresentation, selectNodeColors, selectGroupingCategories],
  (presentationAtlasDefinition, nodeOrderIds, activeLabelIds, labels, nodeColors, groupingCategories) => ({
    presentationAtlasDefinition, nodeOrderIds, activeLabelIds, ...labels, nodeColors, groupingCategories,
  }),
)
