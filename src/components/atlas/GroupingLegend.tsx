import { useAtlasLabelPresentation } from '@/hooks/useAtlasLabelPresentation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectAtlasColorFields, setLabelsEnabled } from '@/store/slices/atlasUi'

export default function GroupingLegend() {
  const dispatch = useAppDispatch()
  const fields = useAppSelector(selectAtlasColorFields)
  const labelsById = useAppSelector(state => state.atlasUi.labelsById)
  const draft = useAppSelector(state => state.visualizationUi.atlasPanel.nodeVisibilityDraft)
  const { groupingCategories } = useAtlasLabelPresentation()

  if (fields.length === 0 || groupingCategories.length === 0) return null

  return (
    <aside className="grouping-legend" aria-label="Node color categories">
      <ul className="grouping-legend__categories" aria-label="Grouping legend">
        {groupingCategories.map(category => {
          const ids = category.nodeIds.filter(id => labelsById[id])
          const enabledCount = ids.filter(id => draft?.[id] ?? labelsById[id].enabled !== false).length
          return (
            <li key={category.key} className="grouping-legend__item">
              <button
                type="button"
                className="grouping-legend__toggle"
                aria-pressed={enabledCount === 0 ? false : enabledCount === ids.length ? true : 'mixed'}
                disabled={ids.length === 0}
                onClick={() => dispatch(setLabelsEnabled({ ids, enabled: enabledCount < ids.length }))}
              >
                <span className="grouping-legend__swatch" style={{ color: category.color }} aria-hidden="true">●</span>
                {category.values.join(' · ')}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
