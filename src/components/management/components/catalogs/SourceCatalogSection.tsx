import { CheckOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'

import { useCatalogItemUpdater } from '@/components/management/components/catalogs/useCatalogItemUpdater'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import type { CatalogItem } from '@/types/network'

import CatalogItemEditor from './CatalogItemEditor'

const EMPTY_SOURCES: Record<string, CatalogItem> = {}

function SourceCatalogSection() {
  const updateItem = useCatalogItemUpdater()
  const sources = useAppSelector((state) => selectDatasetContent(state)?.catalogs.sources) ?? EMPTY_SOURCES

  const [pending, setPending] = useState<Record<string, Partial<CatalogItem>>>({})
  const [baseline, setBaseline] = useState(sources)
  if (baseline !== sources) {
    setBaseline(sources)
    setPending({})
  }
  const updateDraft = (id: string, changes: Partial<CatalogItem>) =>
    setPending((current) => ({ ...current, [id]: { ...current[id], ...changes } }))
  const apply = () => {
    Object.entries(pending).forEach(([id, changes]) => updateItem('sources', id, changes))
    setPending({})
  }

  return (
    <div className="catalog-management-section">
      <div className="catalog-management-grid">
        {Object.values(sources).map((original) => {
          const source = { ...original, ...pending[original.id] }
          return (
            <CatalogItemEditor key={source.id} item={source} label="Source label"
              onChange={changes => updateDraft(source.id, changes)} />
          )
        })}
      </div>
      <div className="catalog-management-actions">
        <Button
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          disabled={Object.keys(pending).length === 0}
          onClick={apply}
        >
          Apply
        </Button>
      </div>
    </div>
  )
}

export default SourceCatalogSection
