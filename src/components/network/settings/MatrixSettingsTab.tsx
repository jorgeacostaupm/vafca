import { CheckOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, Space } from 'antd'
import { useMemo } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  applyMatrixColorSettings,
  resetDraftMatrixColorSettings,
  selectAppliedMatrixColorSettings,
  selectDraftMatrixColorSettings,
} from '@/store/slices/visualizationUi'

import MatrixScaleSettingsSection from './MatrixScaleSettingsSection'
import SettingsSection from './SettingsSection'

export default function MatrixSettingsTab() {
  const dispatch = useAppDispatch()
  const appliedSettings = useAppSelector(selectAppliedMatrixColorSettings)
  const draftSettings = useAppSelector(selectDraftMatrixColorSettings)
  const hasPendingChanges = useMemo(
    () => JSON.stringify(appliedSettings) !== JSON.stringify(draftSettings),
    [appliedSettings, draftSettings],
  )

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <SettingsSection
        description="Use this menu to configure the color scales used by matrix network views."
      >
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
        <div className="matrix-settings-actions">
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={!hasPendingChanges}
              onClick={() => dispatch(applyMatrixColorSettings())}
            >
              Apply
            </Button>
            <Button
              icon={<ReloadOutlined />}
              disabled={!hasPendingChanges}
              onClick={() => dispatch(resetDraftMatrixColorSettings())}
            >
              Reset
            </Button>
          </Space>
        </div>
      </SettingsSection>
    </Space>
  )
}
