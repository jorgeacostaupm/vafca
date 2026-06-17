import { ColorPicker, Form, Select, Slider, Space, Switch, Typography } from 'antd'

import { getMatrixColorScaleDefinitions } from '@/config/matrixColorScales'
import { MAX_MATRIX_COLOR_DISCRETE_STEPS, MIN_MATRIX_COLOR_DISCRETE_STEPS } from '@/config/ui'
import { useAppDispatch } from '@/store/hooks'
import {
  setDraftMatrixColorDiscreteSteps,
  setDraftMatrixColorDiscretize,
  setDraftMatrixColorInvert,
  setDraftMatrixColorScale,
  setDraftMatrixInteractionColor,
} from '@/store/slices/visualizationUi'
import type { ScaleType } from '@/types/network'
import type { MatrixColorScaleSettings } from '@/types/visualizationUi'

import MatrixColorScalePreview from './MatrixColorScalePreview'

type MatrixScaleSettingsSectionProps = {
  scaleType: ScaleType
  title: string
  settings: MatrixColorScaleSettings
}

const normalizeSliderValue = (value: number | [number, number]) =>
  Array.isArray(value) ? value[0] : value

const toHex = (color: { toHexString: () => string }) => color.toHexString()

export default function MatrixScaleSettingsSection({
  scaleType,
  title,
  settings,
}: MatrixScaleSettingsSectionProps) {
  const dispatch = useAppDispatch()
  const definitions = getMatrixColorScaleDefinitions(scaleType)

  return (
    <div className="matrix-settings-scale">
      <div className="matrix-settings-scale__header">
        <Typography.Text strong>{title}</Typography.Text>
      </div>

      <Form layout="vertical" className="matrix-settings-scale__form">
        <Form.Item>
          <Select
            value={settings.scaleId}
            onChange={(scaleId) => dispatch(setDraftMatrixColorScale({ scaleType, scaleId }))}
            options={definitions.map((definition) => ({
              value: definition.id,
              label: definition.label,
            }))}
          />
        </Form.Item>

        <MatrixColorScalePreview scaleType={scaleType} settings={settings} />

        <div className="matrix-settings-color-grid">
          <Form.Item label="Highlight">
            <ColorPicker
              value={settings.highlightColor}
              showText
              onChange={(color) =>
                dispatch(
                  setDraftMatrixInteractionColor({
                    scaleType,
                    colorRole: 'highlight',
                    color: toHex(color),
                  }),
                )
              }
            />
          </Form.Item>
          <Form.Item label="Selection">
            <ColorPicker
              value={settings.selectionColor}
              showText
              onChange={(color) =>
                dispatch(
                  setDraftMatrixInteractionColor({
                    scaleType,
                    colorRole: 'selection',
                    color: toHex(color),
                  }),
                )
              }
            />
          </Form.Item>
        </div>

        <div className="matrix-settings-toggle-grid">
          <Form.Item label="Invert">
            <Switch
              checked={settings.invert}
              onChange={(invert) => dispatch(setDraftMatrixColorInvert({ scaleType, invert }))}
            />
          </Form.Item>

          <Form.Item label="Discretize">
            <Switch
              checked={settings.discretize}
              onChange={(discretize) =>
                dispatch(setDraftMatrixColorDiscretize({ scaleType, discretize }))
              }
            />
          </Form.Item>
        </div>

        <Form.Item
          label={
            <Space size={8}>
              <span>Steps</span>
              <Typography.Text type="secondary">{settings.discreteSteps}</Typography.Text>
            </Space>
          }
        >
          <Slider
            min={MIN_MATRIX_COLOR_DISCRETE_STEPS}
            max={MAX_MATRIX_COLOR_DISCRETE_STEPS}
            step={1}
            value={settings.discreteSteps}
            disabled={!settings.discretize}
            onChange={(value) =>
              dispatch(
                setDraftMatrixColorDiscreteSteps({
                  scaleType,
                  discreteSteps: normalizeSliderValue(value),
                }),
              )
            }
          />
        </Form.Item>
      </Form>
    </div>
  )
}
