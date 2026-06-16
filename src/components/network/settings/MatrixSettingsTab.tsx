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
      <SettingsSection title="Color scales">
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
              disabled={!hasPendingChanges}
              onClick={() => dispatch(resetDraftMatrixColorSettings())}
            >
              Reset
            </Button>
            <Button
              type="primary"
              disabled={!hasPendingChanges}
              onClick={() => dispatch(applyMatrixColorSettings())}
            >
              Apply
            </Button>
          </Space>
        </div>
      </SettingsSection>
    </Space>
  )
}
