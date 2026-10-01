import { Form, Select, Typography } from 'antd'

import { inputSourceId, inputStatisticId } from '@/networkDerivation/calculations/inputStatistics'
import type {
  NetworkCalculationBatchRequest,
  NetworkCalculationMethodDefinition,
} from '@/networkDerivation/calculations/types'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'

type Props = {
  method: NetworkCalculationMethodDefinition
  request: NetworkCalculationBatchRequest
  onChange: (request: NetworkCalculationBatchRequest) => void
}

export default function CalculationStatistics({ method, request, onChange }: Props) {
  const dataset = useAppSelector(selectDatasetContent)
  if (!dataset) return null
  const { catalogs } = dataset
  const options = Object.values(catalogs.statistics).map(({ id, label }) => ({ value: id, label }))
  return (
    <div>
      <Typography.Text type="secondary">
        Assign a catalog statistic to each input. Connectivity measures are selected separately.
      </Typography.Text>
      <div className="compute-networks__control-row">
        {method.requiredInputs.map((input) => {
          const id = inputStatisticId(request, method.id, input)
          const subjectInput = input.role === 'subjectValue' || input.role === 'leftSubjectValue'
          const sourceId = inputSourceId(input.role, request, request.subjectIds?.[0])
          const sourceLabel = subjectInput
            ? 'selected subjects'
            : sourceId
              ? (catalogs.sources[sourceId]?.label ?? sourceId)
              : 'select a source'
          return (
            <Form.Item
              key={input.role}
              label={`${input.label} — ${sourceLabel}`}
              validateStatus={id && catalogs.statistics[id] ? undefined : 'error'}
              help={
                id && catalogs.statistics[id]
                  ? undefined
                  : 'Choose the statistic that supplies this input.'
              }
            >
              <Select
                className="compute-networks__select"
                options={options}
                style={{ width: 300 }}
                aria-label={`${method.label}: ${input.label}`}
                placeholder="Select statistic"
                value={id && catalogs.statistics[id] ? id : undefined}
                onChange={(statisticId) =>
                  onChange({
                    ...request,
                    inputStatistics: {
                      ...request.inputStatistics,
                      [method.id]: {
                        ...request.inputStatistics?.[method.id],
                        [input.role]: statisticId,
                      },
                    },
                  })
                }
              />
            </Form.Item>
          )
        })}
      </div>
    </div>
  )
}
