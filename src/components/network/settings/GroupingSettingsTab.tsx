import { CheckOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Select, Space, Typography } from 'antd'
import { useCallback, useState } from 'react'

import { moveField } from '@/components/atlas/panelFieldUtils'
import type { D3GroupingPaletteKey } from '@/config/groupingPalettes'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectAtlasColorFields,
  selectAtlasColorPalette,
  setAtlasColorFields,
  setAtlasColorPalette,
} from '@/store/slices/atlasUi'
import { humanizeFieldName } from '@/utils/atlas/atlasDefinition'

import GroupingFieldList from './GroupingFieldList'
import GroupingHierarchyPreviews from './GroupingHierarchyPreviews'
import GroupingPaletteSelect from './GroupingPaletteSelect'
import GroupingStatusNotice from './GroupingStatusNotice'
import SettingsSection from './SettingsSection'
import { useAtlasGroupingSettings } from './useAtlasGroupingSettings'

const areFieldListsEqual = (first: string[], second: string[]) =>
  first.length === second.length && first.every((field, index) => field === second[index])
type GroupingDraft = {
  baseColorFields: string[]
  baseColorPalette: D3GroupingPaletteKey
  colorFields: string[]
  colorPalette: D3GroupingPaletteKey
}
export default function GroupingSettingsTab() {
  const dispatch = useAppDispatch()
  const colorFields = useAppSelector(selectAtlasColorFields)
  const colorPalette = useAppSelector(selectAtlasColorPalette)
  const [draft, setDraft] = useState<GroupingDraft>(() => ({
    baseColorFields: colorFields,
    baseColorPalette: colorPalette,
    colorFields,
    colorPalette,
  }))

  const appliedStateChanged =
    !areFieldListsEqual(draft.baseColorFields, colorFields) ||
    draft.baseColorPalette !== colorPalette
  const effectiveColorFields = appliedStateChanged ? colorFields : draft.colorFields
  const effectiveColorPalette = appliedStateChanged ? colorPalette : draft.colorPalette

  const { selectableColorFields, colorCategories, colorPreviewItems } = useAtlasGroupingSettings({
    previewColorFields: effectiveColorFields,
    previewColorPalette: effectiveColorPalette,
  })

  const hasPendingChanges =
    !areFieldListsEqual(effectiveColorFields, colorFields) || effectiveColorPalette !== colorPalette
  const hasGroupingFields = effectiveColorFields.length > 0
  const hasSelectableColorFields = selectableColorFields.length > 0

  const handleMoveField = useCallback(
    (field: string, direction: 'up' | 'down') => {
      setDraft({
        baseColorFields: colorFields,
        baseColorPalette: colorPalette,
        colorFields: moveField(effectiveColorFields, field, direction),
        colorPalette: effectiveColorPalette,
      })
    },
    [colorFields, colorPalette, effectiveColorFields, effectiveColorPalette],
  )

  const handleRemoveField = useCallback(
    (field: string) => {
      setDraft({
        baseColorFields: colorFields,
        baseColorPalette: colorPalette,
        colorFields: effectiveColorFields.filter((value) => value !== field),
        colorPalette: effectiveColorPalette,
      })
    },
    [colorFields, colorPalette, effectiveColorFields, effectiveColorPalette],
  )

  const handleAddField = useCallback(
    (field: string) => {
      setDraft({
        baseColorFields: colorFields,
        baseColorPalette: colorPalette,
        colorFields: [...effectiveColorFields, field],
        colorPalette: effectiveColorPalette,
      })
    },
    [colorFields, colorPalette, effectiveColorFields, effectiveColorPalette],
  )

  const handleApply = useCallback(() => {
    dispatch(setAtlasColorFields(effectiveColorFields))
    dispatch(setAtlasColorPalette(effectiveColorPalette))
  }, [dispatch, effectiveColorFields, effectiveColorPalette])

  const handleDiscard = useCallback(() => {
    setDraft({
      baseColorFields: colorFields,
      baseColorPalette: colorPalette,
      colorFields,
      colorPalette,
    })
  }, [colorFields, colorPalette])

  const handlePaletteChange = useCallback(
    (value: D3GroupingPaletteKey) => {
      setDraft({
        baseColorFields: colorFields,
        baseColorPalette: colorPalette,
        colorFields: effectiveColorFields,
        colorPalette: value,
      })
    },
    [colorFields, colorPalette, effectiveColorFields],
  )

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
              onMoveField={handleMoveField}
              onRemoveField={handleRemoveField}
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
              onChange={(value) => handleAddField(String(value))}
              value={null}
            />
          ) : null}

          <GroupingPaletteSelect value={effectiveColorPalette} onChange={handlePaletteChange} />

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

        <div className="network-settings-grouping__preview-column">
          <GroupingHierarchyPreviews
            previewColorFields={effectiveColorFields}
            previewColorPalette={effectiveColorPalette}
          />
        </div>

        <Space wrap className="network-settings-grouping__actions">
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApply}
            disabled={!hasPendingChanges}
          >
            Apply
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleDiscard} disabled={!hasPendingChanges}>
            Reset
          </Button>
        </Space>
      </div>
    </SettingsSection>
  )
}
