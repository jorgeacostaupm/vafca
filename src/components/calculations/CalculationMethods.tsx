import { Form, Select, Tabs, Typography } from 'antd'
import type { ReactNode } from 'react'

import { DERIVE_NETWORK_TABS } from '@/config/ui'
import type { NetworkCalculationBatchRequest, NetworkCalculationMethodDefinition } from '@/networkDerivation/calculations/types'

type Props = {
  methods: NetworkCalculationMethodDefinition[]
  request: NetworkCalculationBatchRequest
  onChange: (request: NetworkCalculationBatchRequest) => void
  disabled?: boolean
  children: ReactNode
}

export default function CalculationMethods({ methods, request, onChange, disabled, children }: Props) {
  const active = DERIVE_NETWORK_TABS.find((tab) =>
    tab.operations.some((operation) => operation === request.operations[0]),
  ) ?? DERIVE_NETWORK_TABS[0]
  const selectMethod = (operation: NetworkCalculationBatchRequest['operations'][number]) =>
    onChange({ ...request, operations: [operation], selectedAssociatedOutputs: {} })

  return <Tabs activeKey={active.key} onChange={(key) => {
    const tab = DERIVE_NETWORK_TABS.find((item) => item.key === key)
    const operation = tab?.operations.find((id) => methods.some((method) => method.id === id))
    if (operation) selectMethod(operation)
  }} items={DERIVE_NETWORK_TABS.map((tab) => {
    const options = tab.operations.filter((id) => methods.some((method) => method.id === id))
    const method = methods.find((item) => item.id === request.operations[0])
    return {
      key: tab.key,
      label: tab.label,
      disabled: disabled || !options.length,
      children: tab.key === active.key ? <>
        {options.length > 1 && <Form.Item label="Source type">
          <Select className="compute-networks__select" aria-label="Source type" disabled={disabled}
            value={request.operations[0]} onChange={selectMethod}
            options={options.map((id) => ({ value: id,
              label: id.startsWith('subject_') ? 'Subjects' : 'Populations',
            }))} />
        </Form.Item>}
        {method && <Typography.Paragraph type="secondary">{method.description}</Typography.Paragraph>}
        {children}
      </> : null,
    }
  })} />
}
