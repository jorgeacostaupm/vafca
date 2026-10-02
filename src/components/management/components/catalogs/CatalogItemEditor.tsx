import { Card, Input, Space, Switch } from 'antd'
import type { ReactNode } from 'react'

import { isEnabled } from '@/components/management/utils/catalogValues'

type CatalogItemFields = {
  label?: string | null
  description?: string | null
  enabled?: boolean
}

type CatalogItemEditorProps = {
  item: CatalogItemFields
  label: string
  onChange: (changes: Partial<{ label: string; description: string; enabled: boolean }>) => void
  children?: ReactNode
}

export default function CatalogItemEditor({ item, label, onChange, children }: CatalogItemEditorProps) {
  return (
    <Card size="small" className="catalog-management-card">
      <div className="catalog-management-card__body">
        <Space wrap align="start">
          <Input size="small" placeholder={label} aria-label={label} value={item.label ?? ''}
            className="catalog-management-label-input"
            onChange={event => onChange({ label: event.target.value })} />
          <Switch aria-label={`Enable ${label}`} checked={isEnabled(item)}
            onChange={enabled => onChange({ enabled })} />
          {children}
        </Space>
        <Input.TextArea size="small" placeholder="Description" aria-label={`${label} description`}
          value={item.description ?? ''} className="catalog-management-description"
          onChange={event => onChange({ description: event.target.value })} />
      </div>
    </Card>
  )
}
