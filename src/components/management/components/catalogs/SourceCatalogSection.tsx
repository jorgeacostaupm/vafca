import { CheckOutlined } from '@ant-design/icons'
import { Button, Card, Input, Space, Switch } from 'antd'
import { useState } from 'react'

import { useCatalogItemUpdater } from '@/components/management/components/catalogs/useCatalogItemUpdater'
import { isEnabled } from '@/components/management/utils/catalogValues'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import type { CatalogItem } from '@/types/network'

function SourceCatalogSection() {
  const updateItem = useCatalogItemUpdater()
  const sources = useAppSelector((state) => selectDatasetContent(state)?.catalogs.sources ?? {})

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
            <Card key={source.id} size="small" className="catalog-management-card">
              <Space direction="vertical" size={8} className="catalog-management-card__body">
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Source label"
                    value={source.label ?? ''}
                    className="catalog-management-label-input"
                    onChange={(event) =>
                      updateDraft(source.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(source)}
                    onChange={(checked) =>
                      updateDraft(source.id, {
                        enabled: checked,
                      })
                    }
                  />
                </Space>

                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={source.description ?? ''}
                  onChange={(event) =>
                    updateDraft(source.id, {
                      description: event.target.value,
                    })
                  }
                  className="catalog-management-description"
                />
              </Space>
            </Card>
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
