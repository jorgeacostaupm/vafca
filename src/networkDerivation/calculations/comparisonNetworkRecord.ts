import { absoluteCalculationOutput } from "@/networkDerivation/calculations/absoluteDifference";
import { dimensionKey, dimensionLabel, sameDimensions } from "@/networkDerivation/calculations/dimensions";
import { inputStatisticsLabel, methodInputStatistics } from "@/networkDerivation/calculations/inputStatistics";
import {
  buildProvenanceParameters,
  createDerivedNetwork,
  generateDerivedNetworkId,
  generateDerivedNetworkLabel,
  outputValueDomain,
  populationLabel,
  subjectLabel,
} from '@/networkDerivation/calculations/records'
import type {
  NetworkCalculationBatchRequest,
  NetworkCalculationMethodDefinition,
  NetworkCalculationOutputSpec,
  NetworkCalculationState,
} from '@/networkDerivation/calculations/types'
import type {
  MatrixCellValue,
  Network,
  NetworkComparisonDerivation,
} from '@/types/network'

type ComparisonRecordRuntime = {
  state: NetworkCalculationState
  request: NetworkCalculationBatchRequest
  existingIds: Set<string>
}

type SubjectEndpoint = {
  type: 'subject'
  subjectId: string
  network: Network
}

type PopulationEndpoint = {
  type: 'population'
  populationId?: string
  network: Network
  n?: number | null
}

export type ComparisonEndpoint = SubjectEndpoint | PopulationEndpoint

type ComparisonCalculationResult = {
  data: MatrixCellValue[][]
  statMethod: string
  formula: string
  statParameters?: Record<string, unknown>
  comparisonParameters?: Record<string, unknown>
  provenanceExtra?: Record<string, unknown>
}

type CreateComparisonNetworkParams = {
  runtime: ComparisonRecordRuntime
  method: NetworkCalculationMethodDefinition
  output: NetworkCalculationOutputSpec
  endpoints: {
    left: ComparisonEndpoint
    right: ComparisonEndpoint
  }
  dependencies: string[]
  calculation: ComparisonCalculationResult
  labelMode?: 'vs' | 'minus'
}

const endpointId = (endpoint: ComparisonEndpoint) =>
  endpoint.type === 'subject' ? endpoint.subjectId : endpoint.populationId

const endpointLabel = (state: NetworkCalculationState, endpoint: ComparisonEndpoint) =>
  endpoint.type === 'subject'
    ? subjectLabel(state.catalogs, endpoint.subjectId)
    : populationLabel(state.catalogs, endpoint.populationId)

const endpointComparisonParameters = (left: ComparisonEndpoint, right: ComparisonEndpoint) => ({
  leftPopulationId: left.type === 'population' ? left.populationId : undefined,
  rightPopulationId: right.type === 'population' ? right.populationId : undefined,
  subjectId: left.type === 'subject' ? left.subjectId : undefined,
  rightSubjectId: right.type === 'subject' ? right.subjectId : undefined,
  nLeft: left.type === 'population' ? left.n : undefined,
  nRight: right.type === 'population' ? right.n : undefined,
})

const labelParams = (left: ComparisonEndpoint, right: ComparisonEndpoint) => ({
  leftPopulationId: left.type === 'population' ? left.populationId : undefined,
  rightPopulationId: right.type === 'population' ? right.populationId : undefined,
  subjectId: left.type === 'subject' ? left.subjectId : undefined,
  rightSubjectId: right.type === 'subject' ? right.subjectId : undefined,
})

const comparisonSourceId = (leftId?: string, rightId?: string) =>
  `${leftId ?? 'unknown'}-vs-${rightId ?? 'unknown'}`
    .trim()
    .replaceAll(/[^A-Za-z0-9_-]/g, '_')

export const createComparisonNetwork = ({
  runtime,
  method,
  output: requestedOutput,
  endpoints,
  dependencies,
  calculation: signedCalculation,
  labelMode = 'vs',
}: CreateComparisonNetworkParams) => {
  const { state, request, existingIds } = runtime
  const inputStatistics = methodInputStatistics(request, method)
  const statisticsLabel = inputStatisticsLabel(request, method, state.catalogs)
  const statisticsKey = encodeURIComponent(JSON.stringify(inputStatistics))
  const absolute = request.absoluteDifference && requestedOutput.scaleType === 'diverging'
  const output = absolute
    ? absoluteCalculationOutput(requestedOutput)
    : requestedOutput
  const calculation = absolute ? {
    ...signedCalculation,
    data: signedCalculation.data.map((row) => row.map((value) => value === null ? null : Math.abs(value))),
    formula: `abs(${signedCalculation.formula})`,
    statMethod: `absolute_${signedCalculation.statMethod}`,
    comparisonParameters: { ...signedCalculation.comparisonParameters, absoluteDifference: true, absoluteValue: true },
  } : signedCalculation
  const baseNetwork = endpoints.left.network
  const rightDimensions = sameDimensions(baseNetwork.dimensions, endpoints.right.network.dimensions)
    ? undefined : endpoints.right.network.dimensions
  const ids = {
    left: endpointId(endpoints.left),
    right: endpointId(endpoints.right),
  }
  const id = generateDerivedNetworkId({
    prefix: request.outputIdPrefix,
    leftId: ids.left,
    rightId: ids.right,
    subjectId: endpoints.left.type === 'subject' ? endpoints.left.subjectId : undefined,
    dimensions: baseNetwork.dimensions,
    rightDimensions,
    measureId: baseNetwork.measureId,
    operator: `${output.operator}_${statisticsKey}`,
    existingIds,
  })
  existingIds.add(id)

  const endpointParams = endpointComparisonParameters(endpoints.left, endpoints.right)
  const derivation: NetworkComparisonDerivation = {
    type: 'comparison',
    operator: output.operator,
    comparisonType: output.comparisonType,
    formula: calculation.formula,
    leftNetworkId: endpoints.left.network.id,
    rightNetworkId: endpoints.right.network.id,
    parameters: {
      methodId: method.id,
      inputStatistics,
      inputStatisticsLabel: statisticsLabel,
      leftDimensions: baseNetwork.dimensions,
      rightDimensions: endpoints.right.network.dimensions,
      ...endpointParams,
      left: ids.left,
      right: ids.right,
      leftLabel: endpointLabel(state, endpoints.left),
      rightLabel: endpointLabel(state, endpoints.right) + (rightDimensions ? ` · ${dimensionLabel(state.catalogs, rightDimensions)}` : ""),
      alternative: output.operator.includes('p') ? 'two-sided' : undefined,
      ...calculation.comparisonParameters,
    },
  }

  const label = generateDerivedNetworkLabel({
    catalogs: state.catalogs,
    ...labelParams(endpoints.left, endpoints.right),
    dimensions: baseNetwork.dimensions,
    rightDimensions,
    measureId: baseNetwork.measureId,
    suffix: `${output.labelSuffix} (${statisticsLabel})`,
    useMinus: labelMode === 'minus',
  })

  const provenanceParameters = buildProvenanceParameters({
    operation: method.id,
    dimensions: baseNetwork.dimensions,
    rightDimensions,
    measureId: baseNetwork.measureId,
    ...endpointParams,
    formula: calculation.formula,
    methodId: method.id,
    extra: calculation.provenanceExtra,
  })

  return createDerivedNetwork({
    id,
    label,
    sourceId: `${comparisonSourceId(ids.left, ids.right)}-statistics-${statisticsKey}` + (rightDimensions ? `-context-${encodeURIComponent(dimensionKey(rightDimensions))}` : ""),
    dimensions: baseNetwork.dimensions,
    measureId: baseNetwork.measureId,
    nodeSetId: baseNetwork.nodeSetId,
    nodeIds: baseNetwork.nodeIds,
    statisticId: output.statisticId,
    derivation,
    valueDomain: outputValueDomain(output),
    dependencies,
    provenanceParameters: {
      ...provenanceParameters,
      inputStatistics,
      absoluteValue: Boolean(absolute),
      statisticMethod: calculation.statMethod,
      statisticParameters: calculation.statParameters ?? {},
    },
    data: calculation.data,
  })
}
