import { ColorPicker, Form, Slider, Space, Switch, Typography } from 'antd'
import type { Color } from 'antd/es/color-picker'

import SettingsActions from '@/components/common/SettingsActions'
import SettingsSection from '@/components/common/SettingsSection'
import HierarchyCategoryOrderSection from '@/components/management/components/HierarchyCategoryOrderSection'
import {
  DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
  DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
} from '@/config/matrixColorScales'
import {
  CIRCULAR_HIERARCHY_PREVIEW_WIDTH,
  CIRCULAR_LINK_TENSION_MARKS,
  CIRCULAR_LINK_TENSION_STEP,
} from '@/config/ui'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  selectNetworkControls,
  setNetworkCircularEdgeSettings,
} from '@/store/slices/networkVisualization'
import {
  selectCircularVisualStyle,
  setCircularInteractionColor,
} from '@/store/slices/visualizationUi'
import { DEFAULT_CIRCULAR_BUNDLING_ENABLED, DEFAULT_CIRCULAR_LINK_TENSION } from '@/types/circular'

import HierarchySettingsPreview from './hierarchy/HierarchySettingsPreview'
import OrderingFieldsSelect from './OrderingFieldsSelect'
import { useOrderingSettings } from './useOrderingSettings'
import { useSettingsDraft } from './useSettingsDraft'

const normalizeTension = (value: number | [number, number]) =>
  Array.isArray(value) ? value[0] : value

const toHexColor = (color: Color, fallback: string) => color.toHexString() || fallback

export default function CircularSettingsTab() {
  const dispatch = useAppDispatch()
  const controls = useAppSelector(selectNetworkControls)
  const circularVisualStyle = useAppSelector(selectCircularVisualStyle)
  const ordering = useOrderingSettings('circular')
  const { hierarchy } = ordering
  const appliedSettings = {
    linkTension: controls.circularLinkTension ?? DEFAULT_CIRCULAR_LINK_TENSION,
    bundlingEnabled: controls.circularBundlingEnabled ?? DEFAULT_CIRCULAR_BUNDLING_ENABLED,
    positiveLinkColor: controls.circularPositiveLinkColor ?? DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
    negativeLinkColor: controls.circularNegativeLinkColor ?? DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
    highlightColor: circularVisualStyle.highlightColor,
    selectionColor: circularVisualStyle.selectionColor,
  }

  const {
    value: effectiveSettings,
    patch: patchDraft,
    reset,
    hasChanges: hasEdgeChanges,
  } = useSettingsDraft(appliedSettings)
  const hasPendingChanges = hasEdgeChanges || ordering.hasChanges

  const handleReset = () => {
    reset()
    ordering.reset()
  }

  const handleApply = () => {
    if (hasEdgeChanges) {
      dispatch(
        setNetworkCircularEdgeSettings({
          linkTension: effectiveSettings.linkTension,
          bundlingEnabled: effectiveSettings.bundlingEnabled,
          positiveLinkColor: effectiveSettings.positiveLinkColor,
          negativeLinkColor: effectiveSettings.negativeLinkColor,
        }),
      )
      dispatch(
        setCircularInteractionColor({
          colorRole: 'highlight',
          color: effectiveSettings.highlightColor,
        }),
      )
      dispatch(
        setCircularInteractionColor({
          colorRole: 'selection',
          color: effectiveSettings.selectionColor,
        }),
      )
    }
    ordering.apply()
  }

  return (
    <SettingsSection>
      <Form layout="vertical">
        <Form.Item label="Positive edges">
          <ColorPicker
            showText
            value={effectiveSettings.positiveLinkColor}
            onChange={(color) =>
              patchDraft({
                positiveLinkColor: toHexColor(color, effectiveSettings.positiveLinkColor),
              })
            }
          />
        </Form.Item>
        <Form.Item label="Negative edges">
          <ColorPicker
            showText
            value={effectiveSettings.negativeLinkColor}
            onChange={(color) =>
              patchDraft({
                negativeLinkColor: toHexColor(color, effectiveSettings.negativeLinkColor),
              })
            }
          />
        </Form.Item>

        <Form.Item label="Edge bundling">
          <Switch
            checked={effectiveSettings.bundlingEnabled}
            onChange={(value) => patchDraft({ bundlingEnabled: value })}
          />
        </Form.Item>
      </Form>
      <SettingsSection>
        <div className="network-settings-order-layout circular-settings-order-layout">
          <div className="network-settings-order-editor">
            <Typography.Paragraph>Ordering of visible nodes</Typography.Paragraph>
            <OrderingFieldsSelect
              fields={ordering.fields}
              onChange={ordering.setFields}
              orientation="horizontal"
            />
            <HierarchyCategoryOrderSection
              categoryOrderEditors={hierarchy.circularCategoryOrderEditors}
              categoryOrder={ordering.categoryOrder}
              onUpdateCategoryOrder={ordering.setCategoryOrder}
              resolveParentField={(index) => ordering.fields[index] ?? ''}
            />
          </div>
          <div className="network-settings-order-preview">
            <div
              className="circular-settings-edges__preview-panel"
              style={{ width: CIRCULAR_HIERARCHY_PREVIEW_WIDTH }}
            >
              <Form layout="vertical" className="circular-settings-edges__tension">
                <Form.Item
                  label={
                    <Space>
                      <Typography.Text>Link tension</Typography.Text>
                      <Typography.Text type="secondary">
                        {effectiveSettings.linkTension.toFixed(2)}
                      </Typography.Text>
                    </Space>
                  }
                >
                  <Slider
                    min={0}
                    max={1}
                    step={CIRCULAR_LINK_TENSION_STEP}
                    marks={CIRCULAR_LINK_TENSION_MARKS}
                    value={effectiveSettings.linkTension}
                    onChange={(value) => patchDraft({ linkTension: normalizeTension(value) })}
                  />
                </Form.Item>
              </Form>
              <HierarchySettingsPreview
                mode="circular"
                hierarchy={hierarchy}
                circularLinkTension={effectiveSettings.linkTension}
                circularBundlingEnabled={effectiveSettings.bundlingEnabled}
                circularLinkColor={effectiveSettings.positiveLinkColor}
              />
            </div>
          </div>
        </div>
      </SettingsSection>
      <SettingsActions hasChanges={hasPendingChanges} onApply={handleApply} onReset={handleReset} />
    </SettingsSection>
  )
}
