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
import { fetchMatricesByCompoundIds } from '@/store/slices/matrixCache'
import type { RootState } from '@/types/store'
import { buildMatrixLabel } from '@/utils/matrixViewUtils'

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
  async ({ mode, selectedMatrixIds }, { dispatch, getState, rejectWithValue }) => {
    const state = getState()
    const { selectedLinks, atlasLinkIds, matrixShape } = state.visualizationUi

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

    await dispatch(
      fetchMatricesByCompoundIds({
        compoundIds: layerIds,
      }),
    )

    const nextState = getState()
    const matrixCache = nextState.matrixCache.byCompoundId
    const matrixErrors = nextState.matrixCache.errorByCompoundId
    const atlasIndex = new Map(nextState.atlas.order.map((id, index) => [id, index]))
    const matrixLabelMap = buildMatrixLabelMap(
      nextState.matrixSummaries.summaries.map((summary) => ({
        value: summary.compoundId,
        label: buildMatrixLabel(summary, nextState.dataset.data?.catalogs),
      })),
    )
    const sourceLabelMap = buildSourceLabelMap(linksToDownload)
    const resolveLayerLabelById = (compoundId: string) =>
      resolveLayerLabel(compoundId, matrixLabelMap, sourceLabelMap)

    const exportLinks = buildExportLinks(
      linksToDownload,
      layerIds,
      matrixCache,
      atlasIndex,
      matrixShape,
    )
    const payload = buildExportPayload(
      mode,
      matrixShape,
      layerIds,
      resolveLayerLabelById,
      exportLinks,
    )
    downloadExportPayload(payload, mode)

    const failedLayerIds = layerIds.filter((compoundId) => {
      if (matrixErrors[compoundId]) return true
      return !(compoundId in matrixCache) || matrixCache[compoundId] === null
    })

    return {
      mode,
      linksCount: exportLinks.length,
      layersCount: layerIds.length,
      failedLayerIds,
    }
  },
)
