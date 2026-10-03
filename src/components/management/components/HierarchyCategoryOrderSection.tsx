import { ArrowDownOutlined, ArrowUpOutlined, SwapOutlined } from '@ant-design/icons'
import { Button, Space, Typography } from 'antd'

import type { CategoryOrderEditor, CategoryOrderMap } from '@/components/management/types'
import { moveValue, reverseValues } from '@/components/management/utils/hierarchyOrder'
import { humanizeFieldName } from '@/utils/atlas/atlasDefinition'

type HierarchyCategoryOrderSectionProps = {
  categoryOrderEditors: CategoryOrderEditor[]
  categoryOrder: CategoryOrderMap
  onUpdateCategoryOrder: (next: CategoryOrderMap) => void
  resolveParentField: (index: number) => string
}

export default function HierarchyCategoryOrderSection({
  categoryOrderEditors,
  categoryOrder,
  onUpdateCategoryOrder,
  resolveParentField,
}: HierarchyCategoryOrderSectionProps) {
  if (categoryOrderEditors.length === 0) {
    return null
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {categoryOrderEditors.map((editor) => {
        const parentDescription =
          editor.parentValues.length === 0
            ? 'Root level'
            : editor.parentValues
                .map((value, index) => {
                  const parentField = resolveParentField(index)
                  return `${humanizeFieldName(parentField)}: ${value}`
                })
                .join(' · ')

        return (
          <div key={editor.key} className="hierarchy-category-order">
            <Typography.Text strong>{humanizeFieldName(editor.field)}</Typography.Text>
            <Typography.Text type="secondary" className="hierarchy-category-order__parent">
              {parentDescription}
            </Typography.Text>
            <Button
              size="small"
              icon={<SwapOutlined />}
              className="hierarchy-category-order__invert"
              onClick={() =>
                onUpdateCategoryOrder({
                  ...categoryOrder,
                  [editor.key]: reverseValues(editor.values),
                })
              }
              disabled={editor.values.length < 2}
            >
              Invert branch order
            </Button>

            <Space direction="vertical" size={6} className="hierarchy-category-order__values">
              {editor.values.map((value, index) => (
                <div key={value} className="atlas-panel__field-row">
                  <Typography.Text>{value}</Typography.Text>
                  <Space>
                    <Button
                      size="small"
                      icon={<ArrowUpOutlined />}
                      onClick={() =>
                        onUpdateCategoryOrder({
                          ...categoryOrder,
                          [editor.key]: moveValue(editor.values, value, 'up'),
                        })
                      }
                      disabled={index === 0}
                      aria-label={`Move ${value} up`}
                    />
                    <Button
                      size="small"
                      icon={<ArrowDownOutlined />}
                      onClick={() =>
                        onUpdateCategoryOrder({
                          ...categoryOrder,
                          [editor.key]: moveValue(editor.values, value, 'down'),
                        })
                      }
                      disabled={index === editor.values.length - 1}
                      aria-label={`Move ${value} down`}
                    />
                  </Space>
                </div>
              ))}
            </Space>
          </div>
        )
      })}
    </Space>
  )
}
