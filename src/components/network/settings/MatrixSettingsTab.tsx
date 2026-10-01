import { CheckOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Collapse, ColorPicker, Form, Space } from 'antd'
import { useMemo, useState } from 'react'

import HierarchyCategoryOrderSection from '@/components/management/components/HierarchyCategoryOrderSection'
import { DEFAULT_MATRIX_SETTINGS_PANEL } from '@/config/ui'
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
import SettingsSection from './SettingsSection'
import { useOrderingSettings } from './useOrderingSettings'

export default function MatrixSettingsTab() {
  const dispatch = useAppDispatch()
  const appliedSettings = useAppSelector(selectAppliedMatrixColorSettings)
  const draftSettings = useAppSelector(selectDraftMatrixColorSettings)
  const appliedBackgroundColor = useAppSelector(selectAppliedMatrixBackgroundColor)
  const draftBackgroundColor = useAppSelector(selectDraftMatrixBackgroundColor)
  const [activePanel, setActivePanel] = useState<string | string[]>(DEFAULT_MATRIX_SETTINGS_PANEL)
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
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <SettingsSection
        description="Use this menu to configure the color scales used by matrix network views."
      >
        <Collapse
          accordion
          activeKey={activePanel}
          onChange={setActivePanel}
          className="network-settings-accordion"
          items={[
            {
              key: 'colors',
              label: 'Color scale',
              children: (
                <>
                  <Form layout="vertical" className="matrix-settings-global">
                    <Form.Item label="Background">
                      <ColorPicker
                        value={draftBackgroundColor}
                        showText
                        onChange={(color) =>
                          dispatch(setDraftMatrixBackgroundColor(color.toHexString()))
                        }
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
                </>
              ),
            },
            {
              key: 'order',
              label: 'Matrix label order',
              children: (
                <div className="network-settings-order-layout">
                  <div className="network-settings-order-editor">
                    <OrderingFieldsSelect fields={ordering.fields} onChange={ordering.setFields} />
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
              ),
            },
          ]}
        />
        <div className="matrix-settings-actions">
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={!hasPendingChanges}
              onClick={handleApply}
            >
              Apply
            </Button>
            <Button
              icon={<ReloadOutlined />}
              disabled={!hasPendingChanges}
              onClick={handleReset}
            >
              Reset
            </Button>
          </Space>
        </div>
      </SettingsSection>
    </Space>
  )
}
