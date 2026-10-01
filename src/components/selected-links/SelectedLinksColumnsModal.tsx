import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, Modal, Select, Typography } from 'antd'

import type { NetworkOption } from '@/components/selected-links/selectedLinksPanel.types'
import type { AspectFilterOptions } from '@/components/selectors/useNetworkFilterOptions'
import type { NetworkMatrixSelectorMode } from '@/types/networkVisualization'

type FieldSelectorOption = {
  value: string
  label: string
}

type SelectedLinksNetworkFields = {
  sourceId: string
  measureId: string
  statisticId: string
  aspectFilters: Record<string, string>
}

type SelectedLinksNetworkFieldOptions = {
  sources: FieldSelectorOption[]
  measures: FieldSelectorOption[]
  statistics: FieldSelectorOption[]
  aspects: AspectFilterOptions[]
}

type CoreLabels = {
  source: string
  measure: string
  statistic: string
}

type SelectedLinksColumnsModalProps = {
  open: boolean
  onClose: () => void
  networkOptions: NetworkOption[]
  selectedNetworkIds: string[]
  selectedNetworkId: string
  networkOptionsLoading: boolean
  loadingNetworks: boolean
  addColumnsDisabled: boolean
  onSelectedNetworkIdChange: (id: string) => void
  onAddColumns: () => void
  matrixSelectorMode: NetworkMatrixSelectorMode
  fields: SelectedLinksNetworkFields
  fieldOptions: SelectedLinksNetworkFieldOptions
  labels: CoreLabels
  onFieldsChange: (fields: Partial<SelectedLinksNetworkFields>) => void
}

export default function SelectedLinksColumnsModal({
  open,
  onClose,
  networkOptions,
  selectedNetworkIds,
  selectedNetworkId,
  networkOptionsLoading,
  loadingNetworks,
  addColumnsDisabled,
  onSelectedNetworkIdChange,
  onAddColumns,
  matrixSelectorMode,
  fields,
  fieldOptions,
  labels,
  onFieldsChange,
}: SelectedLinksColumnsModalProps) {
  return (
    <Modal title="Add column" open={open} onCancel={onClose} footer={null}>
      <Typography.Paragraph type="secondary">
        Choose additional networks to compare values for the selected links.
      </Typography.Paragraph>
      <div className="links-controls__column-picker">
        {matrixSelectorMode === 'combined' ? (
          <Select
            allowClear
            showSearch
            aria-label="Network column"
            options={networkOptions}
            optionFilterProp="label"
            placeholder="Select network"
            value={selectedNetworkId || undefined}
            loading={networkOptionsLoading}
            className="links-controls__network-select"
            onChange={(value) => onSelectedNetworkIdChange(value ?? '')}
          />
        ) : (
          <Form className="links-controls__field-grid" layout="vertical">
            <Form.Item label={labels.source}>
              <Select
                allowClear
                options={fieldOptions.sources}
                placeholder={`Select ${labels.source.toLowerCase()}...`}
                value={fields.sourceId || undefined}
                onChange={(value) =>
                  onFieldsChange({
                    sourceId: value ?? '',
                    measureId: '',
                    statisticId: '',
                    aspectFilters: {},
                  })
                }
              />
            </Form.Item>
            <Form.Item label={labels.measure}>
              <Select
                allowClear
                disabled={!fields.sourceId}
                options={fieldOptions.measures}
                placeholder={`Select ${labels.measure.toLowerCase()}...`}
                value={fields.measureId || undefined}
                onChange={(value) =>
                  onFieldsChange({
                    measureId: value ?? '',
                    statisticId: '',
                    aspectFilters: {},
                  })
                }
              />
            </Form.Item>
            <Form.Item label={labels.statistic}>
              <Select
                allowClear
                disabled={!fields.measureId}
                options={fieldOptions.statistics}
                placeholder={`Select ${labels.statistic.toLowerCase()}...`}
                value={fields.statisticId || undefined}
                onChange={(value) =>
                  onFieldsChange({
                    statisticId: value ?? '',
                    aspectFilters: {},
                  })
                }
              />
            </Form.Item>
            {fieldOptions.aspects.map((aspect) => (
              <Form.Item key={aspect.id} label={aspect.label}>
                <Select
                  allowClear
                  disabled={!fields.statisticId}
                  options={aspect.options}
                  placeholder={`Select ${aspect.label.toLowerCase()}...`}
                  value={fields.aspectFilters[aspect.id] || undefined}
                  onChange={(value) =>
                    onFieldsChange({
                      aspectFilters: {
                        ...fields.aspectFilters,
                        [aspect.id]: value ?? '',
                      },
                    })
                  }
                />
              </Form.Item>
            ))}
          </Form>
        )}
        <Button
          icon={<PlusOutlined />}
          disabled={addColumnsDisabled}
          onClick={onAddColumns}
          className="links-controls__add-columns"
        >
          Add column
        </Button>
      </div>
      {selectedNetworkIds.length > 0 && loadingNetworks ? (
        <Typography.Text type="secondary">Loading network values…</Typography.Text>
      ) : null}
    </Modal>
  )
}
