import { CheckOutlined } from '@ant-design/icons'
import { Button, Card, Input, Space, Switch, Typography } from 'antd'
import { useState } from 'react'

import { useCatalogItemUpdater } from '@/components/management/components/catalogs/useCatalogItemUpdater'
import { isEnabled } from '@/components/management/utils/catalogValues'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import type { CatalogItem } from '@/types/network'

function AspectCatalogSection() {
  const updateItem = useCatalogItemUpdater()
  const catalogs = useAppSelector((state) => selectDatasetContent(state)?.catalogs)

  const [pending, setPending] = useState<Record<string, Record<string, Partial<CatalogItem>>>>({})
  const datasetId = useAppSelector((state) => state.dataset.id)
  const [baseline, setBaseline] = useState(datasetId)
  if (baseline !== datasetId) {
    setBaseline(datasetId)
    setPending({})
  }
  const updateDraft = (aspectId: string, id: string, changes: Partial<CatalogItem>) =>
    setPending((current) => ({
      ...current,
      [aspectId]: { ...current[aspectId], [id]: { ...current[aspectId]?.[id], ...changes } },
    }))
  const apply = (aspectId: string) => {
    Object.entries(pending[aspectId] ?? {}).forEach(([id, changes]) =>
      updateItem('aspectCatalogs', id, changes, aspectId),
    )
    setPending((current) => {
      const next = { ...current }
      delete next[aspectId]
      return next
    })
  }

  if (!catalogs || catalogs.aspects.length === 0) {
    return <Typography.Text type="secondary">No aspects available.</Typography.Text>
  }

  return (
    <div className="catalog-management-categories">
      {catalogs.aspects.map((aspect) => (
        <section
          key={aspect.id}
          className="catalog-management-section"
          aria-labelledby={`catalog-aspect-${aspect.id}`}
        >
          <Typography.Title level={5} id={`catalog-aspect-${aspect.id}`}>
            {aspect.label}
          </Typography.Title>
          <div className="catalog-management-grid">
            {Object.values(catalogs.aspectCatalogs[aspect.id] ?? {}).map((original) => {
              const item = { ...original, ...pending[aspect.id]?.[original.id] }
              return (
                <Card key={item.id} size="small" className="catalog-management-card">
                  <Space direction="vertical" size={8} className="catalog-management-card__body">
                    <Space wrap size={12} align="start">
                      <Input
                        size="small"
                        placeholder={`${aspect.label} label`}
                        value={item.label ?? ''}
                        className="catalog-management-label-input"
                        onChange={(event) =>
                          updateDraft(aspect.id, item.id, {
                            label: event.target.value,
                          })
                        }
                      />
                      <Switch
                        checked={isEnabled(item)}
                        onChange={(checked) =>
                          updateDraft(aspect.id, item.id, {
                            enabled: checked,
                          })
                        }
                      />
                    </Space>

                    <Input.TextArea
                      size="small"
                      placeholder="Description"
                      value={item.description ?? ''}
                      onChange={(event) =>
                        updateDraft(aspect.id, item.id, {
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
              disabled={Object.keys(pending[aspect.id] ?? {}).length === 0}
              onClick={() => apply(aspect.id)}
            >
              Apply
            </Button>
          </div>
        </section>
      ))}
    </div>
  )
}

export default AspectCatalogSection
