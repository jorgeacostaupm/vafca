import { createAsyncThunk } from '@reduxjs/toolkit'

import { MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE, MATRIX_BRUSH_LINK_DISPATCH_YIELD_MS } from '@/config/ui'
import type { MatrixBrushCell } from '@/types/matrixHeatmap'
import type { RootState } from '@/types/store'
import { createSelectedLinkDraft, getSelectedLinkRemovalIds } from '@/utils/selectedLinkKeys'

import { addSelectedLinks, removeSelectedLinks } from '../visualizationUiSlice'

type MatrixAnnotationBrush = {
  annotationId: string
  mode: 'add' | 'remove'
  cells: MatrixBrushCell[]
  labelOrder: string[]
  labelNames?: Record<string, string>
  compoundId: string
  networkLabel: string
}

export const annotateMatrixBrush = createAsyncThunk<void, MatrixAnnotationBrush, { state: RootState }>(
  'visualizationUi/annotateMatrixBrush',
  async ({ annotationId, mode, cells, labelOrder, labelNames, compoundId, networkLabel }, { dispatch, getState, signal }) => {
    const indices = new Map(labelOrder.map((id, index) => [id, index]))
    // The destination belongs to the gesture, so navigation cannot redirect or truncate its remaining chunks.
    for (let offset = 0; offset < cells.length; offset += MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE) {
      if (signal.aborted || !getState().visualizationUi.annotations.some(item => item.id === annotationId)) return
      const chunk = cells.slice(offset, offset + MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE)
      if (mode === 'remove') {
        dispatch(removeSelectedLinks({ annotationId, ids: chunk.flatMap(cell => getSelectedLinkRemovalIds(cell.rowLabel, cell.colLabel)) }))
      } else {
        const links = chunk.map(cell => ({
          ...createSelectedLinkDraft({
            row: { id: cell.rowLabel, label: labelNames?.[cell.rowLabel] ?? cell.rowLabel, index: indices.get(cell.rowLabel) },
            col: { id: cell.colLabel, label: labelNames?.[cell.colLabel] ?? cell.colLabel, index: indices.get(cell.colLabel) },
          }),
          sources: [{ compoundId, networkLabel, value: cell.value }],
        }))
        dispatch(addSelectedLinks({ annotationId, links }))
      }
      if (offset + MATRIX_BRUSH_LINK_DISPATCH_CHUNK_SIZE < cells.length) {
        await new Promise(resolve => setTimeout(resolve, MATRIX_BRUSH_LINK_DISPATCH_YIELD_MS))
      }
    }
  },
)
