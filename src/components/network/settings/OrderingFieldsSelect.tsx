import { Select, Typography } from 'antd'

import { moveField } from '@/components/atlas/panelFieldUtils'
import { useAtlasDefinition } from '@/hooks/useAtlasDefinition'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetData } from '@/store/slices/dataset'
import { getCommonNodeFields, humanizeFieldName } from '@/utils/atlas/atlasDefinition'
import { getDatasetAtlasId } from '@/utils/datasetAccessors'

import GroupingFieldList from './GroupingFieldList'

export default function OrderingFieldsSelect({ fields, onChange, purpose = 'Ordering' }: {
  fields: string[]
  onChange: (fields: string[]) => void
  purpose?: 'Ordering' | 'Aggregation'
}) {
  const dataset = useAppSelector(selectDatasetData)
  const atlas = useAtlasDefinition(getDatasetAtlasId(dataset))
  const available = getCommonNodeFields(atlas)
  return (
    <div className="network-settings-order-fields">
      <Typography.Text strong>{purpose} fields</Typography.Text>
      <GroupingFieldList fields={fields}
        onMoveField={(field, direction) => onChange(moveField(fields, field, direction))}
        onRemoveField={field => onChange(fields.filter(value => value !== field))} />
      <Select value={null} aria-label={`${purpose} field`} placeholder="Add field"
        className="network-settings-grouping__field-select"
        options={available.filter(field => !fields.includes(field)).map(field => ({ value: field, label: humanizeFieldName(field) }))}
        onChange={(field: string) => onChange([...fields, field])} />
      <Typography.Paragraph type="secondary">
        {purpose === 'Ordering'
          ? 'Fields are applied from first to last. No fields keeps the original node order. Colors follow Grouping. Aggregated nodes with different values are placed under Mixed.'
          : 'These fields determine which nodes are merged. Aggregated labels always use a neutral color, independent of Coloring.'}
      </Typography.Paragraph>
    </div>
  )
}
