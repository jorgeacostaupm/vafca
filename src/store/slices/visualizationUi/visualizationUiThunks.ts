import { createAsyncThunk } from '@reduxjs/toolkit'
import type { DownloadMode } from '@/components/selected-links/selectedLinksPanel.types'
import {
  buildExportLinks,
  buildExportPayload,
  buildMatrixLabelMap,
  buildSourceLabelMap,
  downloadExportPayload,
  resolveLayerLabel,
} from '@/components/selected-links/selectedLinksPanel.utils'
import type { RootState } from '@/types/store'
import { selectDatasetData } from '@/store/slices/dataset'
import { buildMatrixLabel } from '@/utils/matrixViewUtils'
import {
  getDatasetCatalogs,
  getDatasetMatrixByCompoundId,
} from '@/utils/datasetAccessors'

export type DownloadSelectedLinksResult = {
  mode: DownloadMode
  linksCount: number
  layersCount: number
  failedLayerIds: string[]
}

export const downloadSelectedLinks = createAsyncThunk<
  DownloadSelectedLinksResult,
  { mode: DownloadMode; selectedMatrixIds: string[] },
  { state: RootState; rejectValue: string }
>(
    'visualizationUi/downloadSelectedLinks',
  async ({ mode, selectedMatrixIds }, { getState, rejectWithValue }) => {
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

    const allMatrixIds = Array.from(
      new Set(state.matrixSummaries.summaries.map((summary) => summary.compoundId)),
    )
    const layerIds =
      mode === 'all'
        ? allMatrixIds
        : selectedMatrixIds.filter((id) => allMatrixIds.includes(id))
    if (layerIds.length === 0) {
      return rejectWithValue('No layers selected for download.')
    }

    const nextState = getState()
    const dataset = selectDatasetData(nextState)
    const matrixLookup = Object.fromEntries(
      layerIds.map((compoundId) => [
        compoundId,
        getDatasetMatrixByCompoundId(dataset, compoundId) ?? null,
      ]),
    )
    const atlasIndex = new Map(nextState.atlasUi.order.map((id, index) => [id, index]))
    const matrixLabelMap = buildMatrixLabelMap(
      nextState.matrixSummaries.summaries.map((summary) => ({
        value: summary.compoundId,
        label: buildMatrixLabel(summary, getDatasetCatalogs(selectDatasetData(nextState))),
      })),
    )
    const sourceLabelMap = buildSourceLabelMap(linksToDownload)
    const resolveLayerLabelById = (compoundId: string) =>
      resolveLayerLabel(compoundId, matrixLabelMap, sourceLabelMap)

    const exportLinks = buildExportLinks(
      linksToDownload,
      layerIds,
      matrixLookup,
      atlasIndex,
    )
    const payload = buildExportPayload(
      mode,
      layerIds,
      resolveLayerLabelById,
      exportLinks,
    )
    downloadExportPayload(payload, mode)

    const failedLayerIds = layerIds.filter((compoundId) => {
      return matrixLookup[compoundId] === null
    })

    return {
      mode,
      linksCount: exportLinks.length,
      layersCount: layerIds.length,
      failedLayerIds,
    }
  },
)
