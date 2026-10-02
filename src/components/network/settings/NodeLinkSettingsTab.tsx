import { ColorPicker, Form } from 'antd'
import type { Color } from 'antd/es/color-picker'

import SettingsActions from '@/components/common/SettingsActions'
import SettingsSection from '@/components/common/SettingsSection'
import {
  DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
  DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
} from '@/config/matrixColorScales'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectNodeLinkVisualStyle,
  setNodeLinkInteractionColor,
  setNodeLinkLinkColor,
} from '@/store/slices/visualizationUi'

import { useSettingsDraft } from './useSettingsDraft'

const toHexColor = (color: Color, fallback: string) => color.toHexString() || fallback

export default function NodeLinkSettingsTab() {
  const dispatch = useAppDispatch()
  const visualStyle = useAppSelector(selectNodeLinkVisualStyle)
  const applied = {
    positiveLinkColor: visualStyle.positiveLinkColor ?? DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
    negativeLinkColor: visualStyle.negativeLinkColor ?? DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
    highlightColor: visualStyle.highlightColor,
    selectionColor: visualStyle.selectionColor,
  }
  const { value: draft, patch: patchDraft, reset, hasChanges } = useSettingsDraft(applied)

  const handleApply = () => {
    dispatch(
      setNodeLinkLinkColor({
        colorRole: 'positive',
        color: draft.positiveLinkColor,
      }),
    )
    dispatch(
      setNodeLinkLinkColor({
        colorRole: 'negative',
        color: draft.negativeLinkColor,
      }),
    )
    dispatch(
      setNodeLinkInteractionColor({
        colorRole: 'highlight',
        color: draft.highlightColor,
      }),
    )
    dispatch(
      setNodeLinkInteractionColor({
        colorRole: 'selection',
        color: draft.selectionColor,
      }),
    )
  }

  return (
    <SettingsSection description="Use this menu to configure classic node-link interaction colors.">
      <Form layout="vertical" className="node-link-settings-form">
        <Form.Item label="Positive" className="node-link-settings-form__color-item">
          <ColorPicker
            value={draft.positiveLinkColor}
            onChange={(color) =>
              patchDraft({
                positiveLinkColor: toHexColor(color, draft.positiveLinkColor),
              })
            }
          />
        </Form.Item>
        <Form.Item label="Negative" className="node-link-settings-form__color-item">
          <ColorPicker
            value={draft.negativeLinkColor}
            onChange={(color) =>
              patchDraft({
                negativeLinkColor: toHexColor(color, draft.negativeLinkColor),
              })
            }
          />
        </Form.Item>
      </Form>
      <SettingsActions hasChanges={hasChanges} onApply={handleApply} onReset={reset} />
    </SettingsSection>
  )
}
