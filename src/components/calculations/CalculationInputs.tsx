import { SwapOutlined } from '@ant-design/icons'
import { Alert, Button, Form, InputNumber, Select, Switch } from 'antd'

import {
  isValidSampleSize,
  requiredSampleSizeIds,
} from '@/networkDerivation/calculations/sampleSizes'
import type { NetworkCalculationBatchRequest } from '@/networkDerivation/calculations/types'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'

type Props = {
  request: NetworkCalculationBatchRequest
  onChange: (request: NetworkCalculationBatchRequest) => void
}

export default function CalculationInputs({ request, onChange }: Props) {
  const dataset = useAppSelector(selectDatasetContent)
  if (!dataset) return null
  const { catalogs } = dataset
  const sources = Object.values(catalogs.sources)
  const populations = sources
    .filter((source) => source.kind === 'population')
    .map(({ id, label }) => ({ value: id, label }))
  const subjects = sources
    .filter((source) => source.kind === 'subject')
    .map(({ id, label }) => ({ value: id, label }))
  const populationOperation = request.operations.some((id) => id.startsWith('population_'))
  const subjectOperation = request.operations.some((id) => id.startsWith('subject_'))
  const subjectDifference = request.operations.includes('subject_difference')
  const referenceOperation =
    request.operations.includes('subject_zscore_vs_population') ||
    request.operations.includes('population_one_sample_z_test')
  const otherPopulationOperation = request.operations.some(
    (id) => id.startsWith('population_') && id !== 'population_one_sample_z_test',
  )
  const canSwap =
    (!subjectOperation &&
      populationOperation &&
      (!referenceOperation ||
        !otherPopulationOperation ||
        request.referencePopulationId === request.rightPopulationId)) ||
    (subjectDifference &&
      !populationOperation &&
      !referenceOperation &&
      request.subjectIds?.length === 1)
  const missingCatalogSizes = requiredSampleSizeIds(request).filter(
    (id) => !isValidSampleSize(catalogs.sources[id]?.n),
  )
  const update = (patch: Partial<NetworkCalculationBatchRequest>) =>
    onChange({ ...request, ...patch })
  const sourceSelect = (
    label: string,
    field: 'leftPopulationId' | 'rightPopulationId' | 'referencePopulationId' | 'rightSubjectId',
    options = populations,
  ) => (
    <Form.Item label={label}>
      <Select
        style={{ width: 250 }}
        className="compute-networks__select"
        value={request[field]}
        options={options}
        onChange={(value) => update({ [field]: value })}
      />
    </Form.Item>
  )

  return (
    <div className="compute-networks__control-stack">
      <div className="compute-networks__control-row">
        {populationOperation && sourceSelect('Target', 'leftPopulationId')}
        {subjectOperation && (
          <Form.Item label="Target">
            <Select
              mode="multiple"
              className="compute-networks__select"
              value={request.subjectIds}
              options={subjects}
              onChange={(subjectIds) => update({ subjectIds })}
            />
          </Form.Item>
        )}
        {canSwap && (
          <Form.Item label=" ">
            <Button
              icon={<SwapOutlined />}
              onClick={() =>
                update({
                  leftPopulationId: otherPopulationOperation
                    ? request.rightPopulationId
                    : request.referencePopulationId,
                  rightPopulationId: request.leftPopulationId,
                  referencePopulationId: request.leftPopulationId,
                  ...(subjectDifference
                    ? {
                        subjectIds: request.rightSubjectId ? [request.rightSubjectId] : [],
                        rightSubjectId: request.subjectIds?.[0],
                      }
                    : {}),
                })
              }
            ></Button>
          </Form.Item>
        )}
        {otherPopulationOperation && sourceSelect('Control', 'rightPopulationId')}
        {referenceOperation && sourceSelect('Control', 'referencePopulationId')}

        {subjectDifference && sourceSelect('Control', 'rightSubjectId', subjects)}
      </div>
      <div className="compute-networks__control-row">
        <Form.Item label="Connectivity measures">
          <Select
            mode="multiple"
            className="compute-networks__select"
            value={request.measureIds}
            options={Object.values(catalogs.measures).map(({ id, label }) => ({
              value: id,
              label,
            }))}
            onChange={(measureIds) => update({ measureIds })}
          />
        </Form.Item>
      </div>
      {request.operations.some((operation) => operation !== 'correlation') && (
        <Form.Item label="Absolute value of the result">
          <Switch
            checked={request.absoluteDifference ?? false}
            aria-label="Absolute value of the result"
            onChange={(absoluteDifference) => update({ absoluteDifference })}
          />
        </Form.Item>
      )}
      {missingCatalogSizes.length > 0 && (
        <>
          <Alert
            type="info"
            showIcon
            message="These methods require sample sizes. Enter n for each population; the values apply to this calculation."
          />
          <div className="compute-networks__control-row">
            {missingCatalogSizes.map((id) => (
              <Form.Item
                key={id}
                label={`n — ${catalogs.sources[id]?.label ?? id}`}
                validateStatus={isValidSampleSize(request.sampleSizes?.[id]) ? undefined : 'error'}
                help={
                  isValidSampleSize(request.sampleSizes?.[id])
                    ? undefined
                    : 'Enter an integer greater than 1.'
                }
              >
                <InputNumber
                  aria-label={`Sample size for ${catalogs.sources[id]?.label ?? id}`}
                  value={request.sampleSizes?.[id]}
                  onChange={(n) => {
                    const sampleSizes = { ...request.sampleSizes }
                    if (n === null) delete sampleSizes[id]
                    else sampleSizes[id] = n
                    update({ sampleSizes })
                  }}
                />
              </Form.Item>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
