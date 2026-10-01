import { Alert, Button, Form, Select, Typography } from 'antd'
import { useState } from 'react'

import { CORRELATION_DISPLAY_PRECISION } from '@/config/ui'
import { validateNetworkCalculationRequest } from '@/networkDerivation/calculations/resolution'
import type { NetworkCalculationBatchRequest, NetworkCalculationResult } from '@/networkDerivation/calculations/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { computeDerivedNetworks, selectDatasetContent, selectDerivedCalculationStatus } from '@/store/slices/dataset'

export default function CorrelationCalculation() {
  const dispatch = useAppDispatch()
  const dataset = useAppSelector(selectDatasetContent)
  const running = useAppSelector(selectDerivedCalculationStatus) === 'loading'
  const [a, setA] = useState<string>()
  const [b, setB] = useState<string>()
  const [result, setResult] = useState<NetworkCalculationResult | null>(null)
  const [error, setError] = useState('')
  if (!dataset) return null
  const request: NetworkCalculationBatchRequest = {
    operations: ['correlation'], correlationNetworkAId: a, correlationNetworkBId: b,
    dimensionPairs: [], measureIds: [],
  }
  const validation = validateNetworkCalculationRequest(request, dataset)
  const options = dataset.networks.map(network => ({ value: network.id, label: network.label ?? network.id }))
  const calculate = async () => {
    setResult(null)
    setError('')
    try { setResult(await dispatch(computeDerivedNetworks(request)).unwrap()) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Correlation failed.') }
  }
  const network = result?.networks[0] ?? result?.existing[0]
  const summary = network?.derivation?.type === 'comparison' ? network.derivation.parameters : null
  return <div className="compute-networks__tab">
    <Form layout="vertical" disabled={running}>
      <Form.Item label="Correlation method"><Select value="pearson" options={[{ value: 'pearson', label: 'Pearson' }]} /></Form.Item>
      {(['A', 'B'] as const).map(side => <Form.Item key={side} label={`Network ${side}`}>
        <Select showSearch optionFilterProp="label" aria-label={`Network ${side}`} options={options}
          value={side === 'A' ? a : b} onChange={value => {
            if (side === 'A') setA(value)
            else setB(value)
            setResult(null)
            setError('')
          }} />
      </Form.Item>)}
      {a && b && !validation.valid && <Alert type="warning" showIcon message={validation.errors.join(' ')} />}
      <Typography.Paragraph>Uses each undirected connection once (i &lt; j), excludes the diagonal and pairs with missing or nonfinite values. Contributions sum to Pearson r.</Typography.Paragraph>
      <Button type="primary" loading={running} disabled={!validation.valid || running} onClick={calculate}>Derive</Button>
    </Form>
    {error && <Alert type="error" showIcon message={error} />}
    {!!result?.warnings.length && <Alert type={result.existing.length ? 'info' : 'error'} showIcon message={result.warnings.join(' ')} />}
    {summary && <Alert type={result?.existing.length ? 'info' : 'success'} showIcon
      message={`Pearson r: ${Number(summary.r).toPrecision(CORRELATION_DISPLAY_PRECISION)}`}
      description={`Total links: ${summary.totalLinks}. Valid links: ${summary.validLinks}. Excluded links: ${summary.excludedLinks}. Contribution network: ${network?.label}`} />}
  </div>
}
