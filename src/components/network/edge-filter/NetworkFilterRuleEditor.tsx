import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Select, Space, Tooltip, Typography } from 'antd'

import type { NetworkFilterRule } from '@/types/edgeFilter'
import type { Catalogs, Network, UiRangeMode } from '@/types/network'
import { resolveNetworkFilterRange } from '@/utils/edgeFilter'

import NetworkFilterRangeControl from './NetworkFilterRangeControl'

type NetworkOptionGroup = {
  label: string
  options: { value: string; label: string; searchText: string }[]
}

type Props = {
  rule: NetworkFilterRule
  networks: Network[]
  networkGroups: NetworkOptionGroup[]
  catalogs?: Catalogs
  uiRangeMode: UiRangeMode
  onChange: (rule: NetworkFilterRule) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export default function NetworkFilterRuleEditor({
  rule,
  networks,
  networkGroups,
  catalogs,
  uiRangeMode,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const network = networks.find((item) => item.id === rule.networkId)
  const range = network
    ? resolveNetworkFilterRange({
        network,
        catalogs,
        mode: uiRangeMode,
      })
    : { min: -1, max: 1 }
  const isDivergent = 'scaleType' in range && range.scaleType === 'diverging'

  const setValue = <K extends keyof NetworkFilterRule>(key: K, value: NetworkFilterRule[K]) =>
    onChange({ ...rule, [key]: value })

  const configureForNetwork = (networkId: string) => {
    const nextNetwork = networks.find((item) => item.id === networkId)
    if (!nextNetwork) {
      onChange({ ...rule, networkId, operator: 'between' })
      return
    }

    const nextRange = resolveNetworkFilterRange({
      network: nextNetwork,
      catalogs,
      mode: uiRangeMode,
    })
    if (nextRange.scaleType === 'diverging') {
      onChange({
        ...rule,
        networkId,
        operator: 'negative_and_positive_ranges',
        min: null,
        max: null,
        negativeMin: nextRange.min,
        negativeMax: Math.min(0, nextRange.max),
        positiveMin: Math.max(0, nextRange.min),
        positiveMax: nextRange.max,
      })
      return
    }

    onChange({
      ...rule,
      networkId,
      operator: 'between',
      min: nextRange.min,
      max: nextRange.max,
      negativeMin: null,
      negativeMax: null,
      positiveMin: null,
      positiveMax: null,
    })
  }

  const rangeControl = isDivergent ? (
    <Space size={8} className="edge-filter-rule__ranges">
      <NetworkFilterRangeControl
        label="Negative"
        minInputValue={rule.negativeMin}
        maxInputValue={rule.negativeMax}
        minInputLabel="Negative minimum"
        maxInputLabel="Negative maximum"
        onMinInputChange={(value) => setValue('negativeMin', value)}
        onMaxInputChange={(value) => setValue('negativeMax', value)}
      />
      <NetworkFilterRangeControl
        label="Positive"
        minInputValue={rule.positiveMin}
        maxInputValue={rule.positiveMax}
        minInputLabel="Positive minimum"
        maxInputLabel="Positive maximum"
        onMinInputChange={(value) => setValue('positiveMin', value)}
        onMaxInputChange={(value) => setValue('positiveMax', value)}
      />
    </Space>
  ) : (
    <NetworkFilterRangeControl
      label="Range"
      minInputValue={rule.min}
      maxInputValue={rule.max}
      minInputLabel="Minimum value"
      maxInputLabel="Maximum value"
      onMinInputChange={(value) => onChange({ ...rule, operator: 'between', min: value })}
      onMaxInputChange={(value) => onChange({ ...rule, operator: 'between', max: value })}
    />
  )

  return (
    <Card size="small" className="edge-filter-rule">
      <div className="edge-filter-rule__controls">
        <div className="edge-filter-rule__matrix-select">
          <Typography.Text className="edge-filter-rule__field-label">Network</Typography.Text>
          <Select
            showSearch
            value={rule.networkId || undefined}
            placeholder="Select a network"
            options={networkGroups}
            optionFilterProp="searchText"
            style={{ width: '100%' }}
            onChange={configureForNetwork}
          />
        </div>

        {rangeControl}

        <Space wrap className="edge-filter-rule__actions">
          <Tooltip title="Move up">
            <Button aria-label="Move rule up" icon={<ArrowUpOutlined />} onClick={onMoveUp} />
          </Tooltip>
          <Tooltip title="Move down">
            <Button aria-label="Move rule down" icon={<ArrowDownOutlined />} onClick={onMoveDown} />
          </Tooltip>
          <Tooltip title="Delete rule">
            <Button aria-label="Delete rule" danger icon={<DeleteOutlined />} onClick={onDelete} />
          </Tooltip>
        </Space>
      </div>
    </Card>
  )
}
