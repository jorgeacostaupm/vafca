import { PlayCircleOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMemo, useState } from 'react'

import { COMPARISON_PREVIEW_PAGE_SIZE, DERIVE_NETWORK_TABS } from '@/config/ui'
import { getAvailableNetworkCalculations, validateNetworkCalculationRequest } from '@/networkDerivation/calculations'
import { networkDimensionContexts } from '@/networkDerivation/calculations/dimensions'
import type { NetworkCalculationBatchRequest } from '@/networkDerivation/calculations/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { computeDerivedNetworks, selectDatasetContent, selectDerivedCalculationError, selectDerivedCalculationStatus } from '@/store/slices/dataset'

import CalculationInputs from './CalculationInputs'
import CalculationMethods from './CalculationMethods'
import { calculationPreview, type CalculationPreviewRow } from './calculationPreview'
import CalculationStatistics from './CalculationStatistics'
import CorrelationCalculation from './CorrelationCalculation'

const columns: ColumnsType<CalculationPreviewRow> = [
  { title: 'Method', dataIndex: 'method' },
  { title: 'Dimensions (left → right)', dataIndex: 'dimensions' },
  { title: 'Measure', dataIndex: 'measure' },
  { title: 'Left/Target', dataIndex: 'left' },
  { title: 'Right/Control', dataIndex: 'right' },
  { title: 'Input statistics', dataIndex: 'inputs' },
  { title: 'Output stat', dataIndex: 'output' },
  { title: 'Status', dataIndex: 'status' },
]

export default function DerivedNetworksPanel() {
  const dataset = useAppSelector(selectDatasetContent)
  return <Card title="Derive networks">
    {dataset ? <DerivedNetworkCalculationForm key={dataset.id} /> :
      <Alert type="info" showIcon message="Load a dataset to derive networks." />}
  </Card>
}

function DerivedNetworkCalculationForm() {
  const dispatch = useAppDispatch()
  const dataset = useAppSelector(selectDatasetContent)
  const calculationStatus = useAppSelector(selectDerivedCalculationStatus)
  const calculationError = useAppSelector(selectDerivedCalculationError)
  const methods = useMemo(() => dataset ? getAvailableNetworkCalculations(dataset) : [], [dataset])
  const [draft, setDraft] = useState<NetworkCalculationBatchRequest>(() => {
    const sources = Object.values(dataset?.catalogs.sources ?? {})
    const populations = sources.filter((source) => source.kind === 'population')
    const subjects = sources.filter((source) => source.kind === 'subject')
    return {
      operations: DERIVE_NETWORK_TABS.flatMap((tab) => tab.operations)
        .filter((id) => methods.some((method) => method.id === id)).slice(0, 1),
      leftPopulationId: populations[0]?.id,
      rightPopulationId: populations[1]?.id ?? populations[0]?.id,
      referencePopulationId: populations[1]?.id ?? populations[0]?.id,
      subjectIds: subjects.slice(0, 1).map(({ id }) => id),
      rightSubjectId: subjects[1]?.id ?? subjects[0]?.id,
      dimensionPairs: [],
      measureIds: Object.keys(dataset?.catalogs.measures ?? {}),
    }
  })
  const [excludedKeys, setExcludedKeys] = useState<string[]>([])
  const setRequest = (next: NetworkCalculationBatchRequest) => {
    setDraft(next)
    setExcludedKeys([])
  }
  const request = useMemo(() => ({ ...draft, dimensionPairs:
    networkDimensionContexts(dataset?.networks ?? []).map((dimensions) => ({ left: dimensions, right: dimensions })),
  }), [draft, dataset])
  const method = methods.find((item) => item.id === request.operations[0])
  const [summary, setSummary] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const running = calculationStatus === 'loading'
  const previewRows = useMemo(() => dataset && request.operations[0] !== 'correlation' ? calculationPreview(request, dataset, methods) : [], [dataset, methods, request])
  const valid = dataset && validateNetworkCalculationRequest(request, dataset).valid
  const selectedRows = previewRows.filter((row) => row.status === 'ready' && !excludedKeys.includes(row.key))
  const canCalculate = valid && selectedRows.length > 0
  const handleCalculate = async () => {
    if (!canCalculate || running) return
    setSummary(null)
    setWarnings([])
    try {
      const result = await dispatch(computeDerivedNetworks(selectedRows.map((row) => row.request))).unwrap()
      setSummary(`Created ${result.networks.length} networks. Skipped ${result.skipped.length} combinations. Reused ${result.existing.length} existing networks.`)
      setWarnings([...new Set([...result.warnings, ...result.skipped.map((item) => item.reason)])])
    } catch {
      // The slice exposes calculation failures below.
    }
  }

  return <div className="compute-networks">
      {calculationError && <Alert type="error" showIcon message={calculationError} />}
      <CalculationMethods methods={methods} request={request} disabled={running} onChange={(next) => {
        setRequest(next)
        setSummary(null)
        setWarnings([])
      }}>
      {request.operations[0] === 'correlation' ? <CorrelationCalculation /> : <div className="compute-networks__tab">
        <section className="compute-networks__section">
          {!methods.length && <Alert type="warning" showIcon message="No comparison network calculations are available with the currently loaded data." />}
          <Form layout="vertical" disabled={running}>
            <CalculationInputs request={request} onChange={setRequest} />
            {method && <CalculationStatistics method={method} request={request} onChange={setRequest} />}
          </Form>
        </section>
        <section className="compute-networks__section">
          <Typography.Title level={5}>Preview</Typography.Title>
          <Typography.Text type="secondary">
            {previewRows.filter((row) => row.status === 'ready').length} compatible comparisons.
            {' '}{selectedRows.length} selected.
          </Typography.Text>
          {request.operations.length > 0 && !request.dimensionPairs.length &&
            <Alert type="info" showIcon message="No network contexts are available." />}
          {summary && <Alert type="info" showIcon message={summary} />}
          {warnings.length > 0 && <Alert type="warning" showIcon message={warnings.join(' ')} />}
          <Table size="small" columns={columns} dataSource={previewRows}
            rowSelection={{
              selectedRowKeys: selectedRows.map((row) => row.key),
              onChange: (keys) => setExcludedKeys(previewRows.filter((row) => !keys.includes(row.key)).map((row) => row.key)),
              getCheckboxProps: (row) => ({ disabled: running || row.status !== 'ready' }),
            }}
            pagination={{ pageSize: COMPARISON_PREVIEW_PAGE_SIZE }} />
          <Button type="primary" icon={<PlayCircleOutlined />} loading={running}
            disabled={!canCalculate || running} onClick={handleCalculate}>
            {running ? 'Deriving...' : `Derive (${selectedRows.length})`}
          </Button>
        </section>
      </div>
      }
      </CalculationMethods>
  </div>
}
