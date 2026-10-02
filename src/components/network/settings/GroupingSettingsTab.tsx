import { Select, Space, Typography } from 'antd'

import { moveField } from '@/components/atlas/panelFieldUtils'
import SettingsActions from '@/components/common/SettingsActions'
import SettingsSection from '@/components/common/SettingsSection'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectAtlasColorFields,
  selectAtlasColorPalette,
  setAtlasColorFields,
  setAtlasColorPalette,
} from '@/store/slices/atlasUi'
import { humanizeFieldName } from '@/utils/atlas/atlasDefinition'

import GroupingFieldList from './GroupingFieldList'
import GroupingPaletteSelect from './GroupingPaletteSelect'
import GroupingStatusNotice from './GroupingStatusNotice'
import { useAtlasGroupingSettings } from './useAtlasGroupingSettings'
import { useSettingsDraft } from './useSettingsDraft'

const areFieldListsEqual = (first: string[], second: string[]) =>
  first.length === second.length && first.every((field, index) => field === second[index])
export default function GroupingSettingsTab() {
  const dispatch = useAppDispatch()
  const colorFields = useAppSelector(selectAtlasColorFields)
  const colorPalette = useAppSelector(selectAtlasColorPalette)
  const { value: draft, patch, reset, hasChanges: hasPendingChanges } = useSettingsDraft(
    { colorFields, colorPalette },
    (first, second) => areFieldListsEqual(first.colorFields, second.colorFields) && first.colorPalette === second.colorPalette,
  )
  const effectiveColorFields = draft.colorFields
  const effectiveColorPalette = draft.colorPalette

  const { selectableColorFields, colorCategories, colorPreviewItems } = useAtlasGroupingSettings({
    previewColorFields: effectiveColorFields,
    previewColorPalette: effectiveColorPalette,
  })

  const hasGroupingFields = effectiveColorFields.length > 0
  const hasSelectableColorFields = selectableColorFields.length > 0

  const handleApply = () => {
    dispatch(setAtlasColorFields(effectiveColorFields))
    dispatch(setAtlasColorPalette(effectiveColorPalette))
  }

  return (
    <SettingsSection
      description="Use this menu to configure node and label colors. Ordering is configured independently in Matrices and Connectogram."
    >
      <div className="network-settings-grouping">
        <Space direction="vertical" size={12} className="network-settings-grouping__controls">
          <GroupingStatusNotice appliedFields={colorFields} />

          {hasGroupingFields ? (
            <GroupingFieldList
              fields={effectiveColorFields}
              onMoveField={(field, direction) => patch({ colorFields: moveField(effectiveColorFields, field, direction) })}
              onRemoveField={field => patch({ colorFields: effectiveColorFields.filter(value => value !== field) })}
            />
          ) : null}

          {hasSelectableColorFields ? (
            <Select
              key={effectiveColorFields.join('|')}
              placeholder="Select field"
              className="network-settings-grouping__field-select"
              options={selectableColorFields.map((field) => ({
                value: field,
                label: humanizeFieldName(field),
              }))}
              onChange={value => patch({ colorFields: [...effectiveColorFields, String(value)] })}
              value={null}
            />
          ) : null}

          <GroupingPaletteSelect value={effectiveColorPalette} onChange={colorPalette => patch({ colorPalette })} />

          {hasGroupingFields ? (
            <div className="atlas-panel__color-preview">
              {colorCategories.length === 0 ? (
                <Typography.Text type="secondary">No categories available.</Typography.Text>
              ) : (
                colorPreviewItems.map((category) => (
                  <div
                    key={category.key}
                    className={`atlas-panel__color-category ${
                      category.count === 0 ? 'atlas-panel__color-category--empty' : ''
                    }`}
                  >
                    <span
                      className="atlas-panel__color-swatch"
                      style={{ backgroundColor: category.color }}
                    />
                    <Typography.Text ellipsis={{ tooltip: category.label }}>
                      {category.label}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {category.count > 0 ? `(${category.count})` : '(preview)'}
                    </Typography.Text>
                  </div>
                ))
              )}
            </div>
          ) : null}
        </Space>

        <SettingsActions hasChanges={hasPendingChanges} onApply={handleApply} onReset={reset} />
      </div>
    </SettingsSection>
  )
}
