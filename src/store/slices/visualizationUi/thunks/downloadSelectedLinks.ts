import { createAsyncThunk } from '@reduxjs/toolkit'

import type { DownloadMode } from '@/components/selected-links/selectedLinksPanel.types'
import {
  buildExportLinks,
  buildExportPayload,
  buildNetworkSummaryLabelMap,
  buildSourceLabelMap,
  downloadExportPayload,
  resolveNetworkLabel,
} from '@/components/selected-links/selectedLinksPanel.utils'
import {
  selectDatasetData,
  selectDatasetNetworkSummaries,
} from '@/store/slices/dataset'
import type { RootState } from '@/types/store'
import {
  getDatasetCatalogs,
  getMaterializedNetworkByCompoundId,
} from '@/utils/datasetAccessors'
import { buildNetworkSummaryLabel } from '@/utils/matrixViewUtils'

export type DownloadSelectedLinksResult = {
  mode: DownloadMode
  linksCount: number
  networksCount: number
  failedNetworkIds: string[]
}

export const downloadSelectedLinks = createAsyncThunk<
  DownloadSelectedLinksResult,
  { mode: DownloadMode; selectedNetworkIds: string[] },
  { state: RootState; rejectValue: string }
>(
  'visualizationUi/downloadSelectedLinks',
  async ({ mode, selectedNetworkIds }, { getState, rejectWithValue }) => {
    const state = getState()
    const { selectedLinks, atlasLinkIds } = state.visualizationUi

    const selectedIdSet = new Set(atlasLinkIds)
    const linksToDownload =
      selectedIdSet.size > 0
        ? selectedLinks.filter((link) => selectedIdSet.has(link.id))
        : selectedLinks
    if (linksToDownload.length === 0) {
      return rejectWithValue('No links available to download.')
    }

    const summaries = selectDatasetNetworkSummaries(state)
    const allNetworkIds = Array.from(
      new Set(summaries.map((summary) => summary.compoundId)),
    )
    const networkIds =
      mode === 'all'
        ? allNetworkIds
        : selectedNetworkIds.filter((id) => allNetworkIds.includes(id))
    if (networkIds.length === 0) {
      return rejectWithValue('No networks selected for download.')
    }

    const nextState = getState()
    const dataset = selectDatasetData(nextState)
    const nextSummaries = selectDatasetNetworkSummaries(nextState)
    const catalogs = getDatasetCatalogs(dataset)
    const networkLookup = Object.fromEntries(
      networkIds.map((compoundId) => [
        compoundId,
        getMaterializedNetworkByCompoundId(dataset, compoundId) ?? null,
      ]),
    )
    const atlasIndex = new Map(nextState.atlasUi.order.map((id, index) => [id, index]))
    const networkLabelMap = buildNetworkSummaryLabelMap(
      nextSummaries.map((summary) => ({
        value: summary.compoundId,
        label: buildNetworkSummaryLabel(summary, catalogs),
      })),
    )
    const sourceLabelMap = buildSourceLabelMap(linksToDownload)
    const resolveNetworkLabelById = (compoundId: string) =>
      resolveNetworkLabel(compoundId, networkLabelMap, sourceLabelMap)

    const exportLinks = buildExportLinks(
      linksToDownload,
      networkIds,
      networkLookup,
      atlasIndex,
    )
    const payload = buildExportPayload(
      mode,
      networkIds,
      resolveNetworkLabelById,
      exportLinks,
    )
    downloadExportPayload(payload, mode)

    const failedNetworkIds = networkIds.filter((compoundId) => {
      return networkLookup[compoundId] === null
    })

    return {
      mode,
      linksCount: exportLinks.length,
      networksCount: networkIds.length,
      failedNetworkIds,
    }
  },
)
