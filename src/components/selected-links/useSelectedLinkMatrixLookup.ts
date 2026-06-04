import { useMemo } from 'react'

import { useAppSelector } from '@/store/hooks'
import { selectDatasetData } from '@/store/slices/dataset'
import { getDatasetMatrixByCompoundId } from '@/utils/datasetAccessors'

export const useSelectedLinkMatrixLookup = (selectedMatrixIds: string[]) => {
  const dataset = useAppSelector(selectDatasetData)

  const matrixLookup = useMemo(
    () =>
      Object.fromEntries(
        selectedMatrixIds.map((compoundId) => [
          compoundId,
          getDatasetMatrixByCompoundId(dataset, compoundId) ?? null,
        ]),
      ),
    [dataset, selectedMatrixIds],
  )

  return {
    matrixLookup,
    loadingMatrices: false,
  }
}
