import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, Select, Typography } from 'antd'

import { useNetworkSelectorModel } from '@/components/network/useNetworkSelectorModel'

function AddViewButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={onClick}
      disabled={disabled}
      className="network-selector-controls__add"
    >
      Add network
    </Button>
  )
}

export default function NetworkSelectorControls() {
  const {
    controls,
    status,
    error,
    measures,
    sources,
    aspects,
    statistics,
    networks,
    labels,
    disabled,
    onSourceChange,
    onMeasureChange,
    onStatisticChange,
    onAspectChange,
    onNetworkChange,
    onAddView,
  } = useNetworkSelectorModel()

  if (status === 'loading') {
    return (
      <Typography.Text className="network-selector-controls__status">
        Loading network list…
      </Typography.Text>
    )
  }

  if (status === 'error') {
    return (
      <Typography.Text className="network-selector-controls__status" type="danger">
        Error: {error}
      </Typography.Text>
    )
  }

  const addButton = <AddViewButton onClick={onAddView} disabled={!controls.selectedCompoundId} />

  return (
    <Form className={`network-selector-controls`} layout="vertical">
      {controls.matrixSelectorMode === 'combined' ? (
        <div className="network-selector-controls__network-row">
          <Form.Item label="Network" className="network-selector-controls__network">
            <Select
              placeholder="Select network..."
              value={controls.selectedCompoundId || undefined}
              onChange={onNetworkChange}
              allowClear
              showSearch
              optionFilterProp="label"
              options={networks}
            />
          </Form.Item>

          {addButton}
        </div>
      ) : (
        <div className="network-selector-controls__filter-grid">
          <Form.Item label={labels.source}>
            <Select
              placeholder={`Select ${labels.source.toLowerCase()}...`}
              value={controls.sourceId || undefined}
              onChange={onSourceChange}
              allowClear
              options={sources}
            />
          </Form.Item>

          <Form.Item label={labels.measure}>
            <Select
              placeholder={`Select ${labels.measure.toLowerCase()}...`}
              value={controls.measureId || undefined}
              onChange={onMeasureChange}
              allowClear
              disabled={disabled.measures}
              options={measures}
            />
          </Form.Item>

          <Form.Item label={labels.statistic}>
            <Select
              placeholder={`Select ${labels.statistic.toLowerCase()}...`}
              value={controls.statisticId || undefined}
              onChange={onStatisticChange}
              allowClear
              disabled={disabled.stats}
              options={statistics}
            />
          </Form.Item>

          {aspects.map((aspect) => (
            <Form.Item key={aspect.id} label={aspect.label}>
              <Select
                placeholder={`Select ${aspect.label.toLowerCase()}...`}
                value={controls.aspectFilters[aspect.id] || undefined}
                onChange={(value) => onAspectChange(aspect.id, value)}
                allowClear
                disabled={disabled.aspects}
                options={aspect.options}
              />
            </Form.Item>
          ))}

          {addButton}
        </div>
      )}
    </Form>
  )
}
