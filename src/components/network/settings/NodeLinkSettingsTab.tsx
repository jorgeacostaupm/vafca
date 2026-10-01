import { CheckOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, ColorPicker, Form, Space } from 'antd'
import type { Color } from 'antd/es/color-picker'
import { useState } from 'react'

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

import SettingsSection from './SettingsSection'

type NodeLinkInteractionDraft = {
  positiveLinkColor: string
  negativeLinkColor: string
  highlightColor: string
  selectionColor: string
}

const toHexColor = (color: Color, fallback: string) => color.toHexString() || fallback

const areDraftsEqual = (
  first: NodeLinkInteractionDraft,
  second: NodeLinkInteractionDraft,
) =>
  first.positiveLinkColor === second.positiveLinkColor &&
  first.negativeLinkColor === second.negativeLinkColor &&
  first.highlightColor === second.highlightColor &&
  first.selectionColor === second.selectionColor

export default function NodeLinkSettingsTab() {
  const dispatch = useAppDispatch()
  const visualStyle = useAppSelector(selectNodeLinkVisualStyle)
  const [draft, setDraft] = useState<NodeLinkInteractionDraft>({
    positiveLinkColor: visualStyle.positiveLinkColor ?? DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
    negativeLinkColor: visualStyle.negativeLinkColor ?? DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
    highlightColor: visualStyle.highlightColor,
    selectionColor: visualStyle.selectionColor,
  })
  const applied = {
    positiveLinkColor: visualStyle.positiveLinkColor ?? DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
    negativeLinkColor: visualStyle.negativeLinkColor ?? DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
    highlightColor: visualStyle.highlightColor,
    selectionColor: visualStyle.selectionColor,
  }
  const hasPendingChanges = !areDraftsEqual(draft, applied)

  const patchDraft = (patch: Partial<NodeLinkInteractionDraft>) => {
    setDraft({ ...draft, ...patch })
  }

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
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
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
        <div className="circular-settings-actions">
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
              onClick={() => setDraft(applied)}
            >
              Reset
            </Button>
          </Space>
        </div>
      </SettingsSection>
    </Space>
  )
}
