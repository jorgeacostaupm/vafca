import { CheckOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { Alert, Button, Form, Switch, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Key } from 'react'

import { COMPARISON_PREVIEW_PAGE_SIZE } from '@/config/ui'
import type { NetworkCalculationBatchRequest } from '@/networkDerivation/calculations/types'
import { useAppSelector } from '@/store/hooks'
import { selectDerivedCalculationStatus } from '@/store/slices/dataset'

import type { CalculationPreviewRow } from './calculationPreview'

const columns: ColumnsType<CalculationPreviewRow> = [
  { title: 'Aspects', dataIndex: 'dimensions', render: (dimensions, row) => <>
    {dimensions}{' '}
    {row.calculated && <CheckOutlined aria-label="Calculated" className="compute-networks__calculated" />}
    {row.status !== 'ready' && <Typography.Text type="secondary">{row.status}</Typography.Text>}
  </> },
]

type Props = {
  request: NetworkCalculationBatchRequest
  onChange: (request: NetworkCalculationBatchRequest) => void
  rows: CalculationPreviewRow[]
  selectedRows: CalculationPreviewRow[]
  summary: string | null
  warnings: string[]
  canCalculate: boolean
  onCalculate: () => void
  onSelectionChange: (keys: Key[]) => void
}

export default function CalculationPreviewTable({ request, onChange, rows, selectedRows,
  summary, warnings, canCalculate, onCalculate, onSelectionChange }: Props) {
  const running = useAppSelector(selectDerivedCalculationStatus) === 'loading'
  return <section className="compute-networks__section">
    <Typography.Title level={5}>Preview</Typography.Title>
    <Typography.Text type="secondary">
      {rows.filter((row) => row.status === 'ready').length} compatible comparisons. {selectedRows.length} selected.
    </Typography.Text>
    {request.operations.length > 0 && !request.dimensionPairs.length &&
      <Alert type="info" showIcon message="No network contexts are available." />}
    {summary && <Alert type="info" showIcon message={summary} />}
    {warnings.length > 0 && <Alert type="warning" showIcon message={warnings.join(' ')} />}
    <Form layout="vertical" disabled={running}>
      <Form.Item label="Absolute value of the result">
        <Switch checked={request.absoluteDifference ?? false}
          aria-label="Absolute value of the result"
          onChange={(absoluteDifference) => onChange({ ...request, absoluteDifference })} />
      </Form.Item>
    </Form>
    <Table size="small" columns={columns} dataSource={rows}
      rowSelection={{
        selectedRowKeys: selectedRows.map((row) => row.key),
        onChange: onSelectionChange,
        getCheckboxProps: (row) => ({ disabled: running || row.status !== 'ready' }),
      }}
      pagination={{ pageSize: COMPARISON_PREVIEW_PAGE_SIZE }} />
    <div className="compute-networks__derive-action">
      <Button size="small" type="primary" icon={<PlayCircleOutlined />} loading={running}
        disabled={!canCalculate || running} onClick={onCalculate}>
        {running ? 'Deriving...' : `Derive (${selectedRows.length})`}
      </Button>
    </div>
  </section>
}
