import { ColorPicker, Form, Typography } from 'antd'
import { useMemo } from 'react'

import SettingsActions from '@/components/common/SettingsActions'
import SettingsSection from '@/components/common/SettingsSection'
import HierarchyCategoryOrderSection from '@/components/management/components/HierarchyCategoryOrderSection'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  applyMatrixColorSettings,
  resetDraftMatrixColorSettings,
  selectAppliedMatrixBackgroundColor,
  selectAppliedMatrixColorSettings,
  selectDraftMatrixBackgroundColor,
  selectDraftMatrixColorSettings,
  setDraftMatrixBackgroundColor,
} from '@/store/slices/visualizationUi'

import HierarchySettingsPreview from './hierarchy/HierarchySettingsPreview'
import MatrixScaleSettingsSection from './MatrixScaleSettingsSection'
import OrderingFieldsSelect from './OrderingFieldsSelect'
import { useOrderingSettings } from './useOrderingSettings'

export default function MatrixSettingsTab() {
  const dispatch = useAppDispatch()
  const appliedSettings = useAppSelector(selectAppliedMatrixColorSettings)
  const draftSettings = useAppSelector(selectDraftMatrixColorSettings)
  const appliedBackgroundColor = useAppSelector(selectAppliedMatrixBackgroundColor)
  const draftBackgroundColor = useAppSelector(selectDraftMatrixBackgroundColor)
  const ordering = useOrderingSettings('matrix')
  const { hierarchy } = ordering

  const hasColorChanges = useMemo(
    () =>
      JSON.stringify(appliedSettings) !== JSON.stringify(draftSettings) ||
      appliedBackgroundColor !== draftBackgroundColor,
    [appliedBackgroundColor, appliedSettings, draftBackgroundColor, draftSettings],
  )
  const hasPendingChanges = hasColorChanges || ordering.hasChanges

  const handleApply = () => {
    if (hasColorChanges) dispatch(applyMatrixColorSettings())
    ordering.apply()
  }

  const handleReset = () => {
    if (hasColorChanges) dispatch(resetDraftMatrixColorSettings())
    ordering.reset()
  }

  return (
    <SettingsSection>
      <Form layout="vertical">
        <Form.Item label="Background">
          <ColorPicker
            value={draftBackgroundColor}
            showText
            onChange={(color) => dispatch(setDraftMatrixBackgroundColor(color.toHexString()))}
          />
        </Form.Item>
      </Form>
      <div className="matrix-settings-grid">
        <MatrixScaleSettingsSection
          scaleType="sequential"
          title="Sequential"
          settings={draftSettings.sequential}
        />
        <MatrixScaleSettingsSection
          scaleType="diverging"
          title="Diverging"
          settings={draftSettings.diverging}
        />
      </div>
      <SettingsSection>
        <div className="network-settings-order-layout matrix-settings-order-layout">
          <div className="network-settings-order-editor">
            <Typography.Paragraph>Ordering of visible nodes</Typography.Paragraph>
            <OrderingFieldsSelect
              fields={ordering.fields}
              onChange={ordering.setFields}
              orientation="horizontal"
            />
            <HierarchyCategoryOrderSection
              categoryOrderEditors={hierarchy.matrixCategoryOrderEditors}
              categoryOrder={ordering.categoryOrder}
              onUpdateCategoryOrder={ordering.setCategoryOrder}
              resolveParentField={(index) => ordering.fields[index] ?? ''}
            />
          </div>
          <div className="network-settings-order-preview">
            <HierarchySettingsPreview mode="matrix" hierarchy={hierarchy} />
          </div>
        </div>
      </SettingsSection>
      <SettingsActions hasChanges={hasPendingChanges} onApply={handleApply} onReset={handleReset} />
    </SettingsSection>
  )
}
