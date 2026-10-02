import { Alert, Form } from 'antd'

import type { NetworkCalculationBatchRequest, NetworkCalculationMethodDefinition } from '@/networkDerivation/calculations/types'
import { useAppSelector } from '@/store/hooks'
import { selectDerivedCalculationStatus } from '@/store/slices/dataset'

import CalculationInputs from './CalculationInputs'
import CalculationStatistics from './CalculationStatistics'

type Props = {
  method?: NetworkCalculationMethodDefinition
  request: NetworkCalculationBatchRequest
  onChange: (request: NetworkCalculationBatchRequest) => void
}

export default function CalculationConfiguration({ method, request, onChange }: Props) {
  const running = useAppSelector(selectDerivedCalculationStatus) === 'loading'
  return <section className="compute-networks__section">
    {!method && <Alert type="warning" showIcon message="No comparison network calculations are available with the currently loaded data." />}
    <Form layout="vertical" disabled={running}>
      <CalculationInputs request={request} onChange={onChange} />
      {method && <CalculationStatistics method={method} request={request} onChange={onChange} />}
    </Form>
  </section>
}
