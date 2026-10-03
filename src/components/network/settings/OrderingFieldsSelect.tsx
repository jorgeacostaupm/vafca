import { Select } from 'antd'

import { moveField } from '@/components/atlas/panelFieldUtils'
import { useAtlasDefinition } from '@/hooks/useAtlasDefinition'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetData } from '@/store/slices/dataset'
import { getCommonNodeFields, humanizeFieldName } from '@/utils/atlas/atlasDefinition'
import { getDatasetAtlasId } from '@/utils/datasetAccessors'

import GroupingFieldList from './GroupingFieldList'

export default function OrderingFieldsSelect({
  fields,
  onChange,
  orientation = 'vertical',
}: {
  fields: string[]
  onChange: (fields: string[]) => void
  orientation?: 'horizontal' | 'vertical'
}) {
  const dataset = useAppSelector(selectDatasetData)
  const atlas = useAtlasDefinition(getDatasetAtlasId(dataset))
  const available = getCommonNodeFields(atlas)
  return (
    <div className="network-settings-order-fields">
      <GroupingFieldList
        fields={fields}
        onMoveField={(field, direction) => onChange(moveField(fields, field, direction))}
        onRemoveField={(field) => onChange(fields.filter((value) => value !== field))}
        orientation={orientation}
      >
        <Select
          value={null}
          placeholder="Add field"
          className="grouping-field-list__select"
          options={available
            .filter((field) => !fields.includes(field))
            .map((field) => ({ value: field, label: humanizeFieldName(field) }))}
          onChange={(field: string) => onChange([...fields, field])}
        />
      </GroupingFieldList>
    </div>
  )
}
