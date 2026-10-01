import { useMemo, useState } from 'react'

import { useManagementHierarchy } from '@/components/management/hooks/useManagementHierarchy'
import type { CategoryOrderMap } from '@/components/management/types'
import { areCategoryOrdersEqual, toCleanCategoryOrderMap } from '@/components/management/utils/hierarchyOrder'
import { useAtlasDefinition } from '@/hooks/useAtlasDefinition'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setCircularHierarchyCategoryOrder, setCircularHierarchyFields, setMatrixHierarchyCategoryOrder, setMatrixHierarchyFields } from '@/store/slices/atlasUi'
import { selectDatasetData } from '@/store/slices/dataset'
import { getDatasetAtlasId } from '@/utils/datasetAccessors'

export const useOrderingSettings = (mode: 'matrix' | 'circular') => {
  const dispatch = useAppDispatch()
  const atlas = useAppSelector(state => state.atlasUi)
  const dataset = useAppSelector(selectDatasetData)
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset))
  const appliedFields = mode === 'matrix' ? atlas.matrixHierarchyFields : atlas.circularHierarchyFields
  const appliedOrder = mode === 'matrix' ? atlas.matrixHierarchyCategoryOrder : atlas.circularHierarchyCategoryOrder
  const [draft, setDraft] = useState({ baseFields: appliedFields, baseOrder: appliedOrder, fields: appliedFields, order: appliedOrder })
  const changed = draft.baseFields !== appliedFields || draft.baseOrder !== appliedOrder
  const fields = changed ? appliedFields : draft.fields
  const order = changed ? appliedOrder : draft.order
  const hierarchy = useManagementHierarchy({
    atlas, atlasDefinition, syncCategoryOrder: false,
    ...(mode === 'matrix' ? { previewMatrixFields: fields, previewMatrixCategoryOrder: order }
      : { previewCircularFields: fields, previewCircularCategoryOrder: order }),
  })
  const editors = mode === 'matrix' ? hierarchy.matrixCategoryOrderEditors : hierarchy.circularCategoryOrderEditors
  const categoryOrder = useMemo(() => toCleanCategoryOrderMap(editors), [editors])
  const hasChanges = JSON.stringify(fields) !== JSON.stringify(appliedFields) || !areCategoryOrdersEqual(categoryOrder, appliedOrder)
  const update = (nextFields: string[], nextOrder: CategoryOrderMap) => setDraft({
    baseFields: appliedFields, baseOrder: appliedOrder, fields: nextFields, order: nextOrder,
  })
  return {
    hierarchy, fields, categoryOrder, hasChanges,
    setFields: (next: string[]) => update(next, {}),
    setCategoryOrder: (next: CategoryOrderMap) => update(fields, next),
    reset: () => update(appliedFields, appliedOrder),
    apply: () => {
      if (!hasChanges) return
      dispatch(mode === 'matrix' ? setMatrixHierarchyFields(fields) : setCircularHierarchyFields(fields))
      dispatch(mode === 'matrix' ? setMatrixHierarchyCategoryOrder(categoryOrder) : setCircularHierarchyCategoryOrder(categoryOrder))
    },
  }
}
