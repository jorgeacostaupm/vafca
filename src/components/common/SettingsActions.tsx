import { CheckOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

type SettingsActionsProps = {
  hasChanges: boolean
  onApply: () => void
  onReset: () => void
}

export default function SettingsActions({ hasChanges, onApply, onReset }: SettingsActionsProps) {
  return (
    <div className="app-settings-actions">
      <Button type="primary" icon={<CheckOutlined />} disabled={!hasChanges} onClick={onApply}>
        Apply
      </Button>
      <Button icon={<ReloadOutlined />} disabled={!hasChanges} onClick={onReset}>
        Reset
      </Button>
    </div>
  )
}
