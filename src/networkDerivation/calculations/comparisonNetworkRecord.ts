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
  ComparisonSide,
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

const endpointSource = (
  state: NetworkCalculationState,
  endpoint: ComparisonEndpoint,
): ComparisonSide =>
  endpoint.type === 'subject'
    ? {
        type: 'subject',
        subjectId: endpoint.subjectId,
        label: endpointLabel(state, endpoint),
      }
    : {
        type: 'population',
        populationId: endpoint.populationId ?? 'unknown-population',
        label: endpointLabel(state, endpoint),
        n: endpoint.n ?? undefined,
      }

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

export const createComparisonNetwork = ({
  runtime,
  method,
  output,
  endpoints,
  dependencies,
  calculation,
  labelMode = 'vs',
}: CreateComparisonNetworkParams) => {
  const { state, request, existingIds } = runtime
  const baseNetwork = endpoints.left.network
  const ids = {
    left: endpointId(endpoints.left),
    right: endpointId(endpoints.right),
  }
  const id = generateDerivedNetworkId({
    prefix: request.outputIdPrefix,
    leftId: ids.left,
    rightId: ids.right,
    subjectId: endpoints.left.type === 'subject' ? endpoints.left.subjectId : undefined,
    layerId: baseNetwork.context.layerId,
    measureId: baseNetwork.measureId,
    operator: output.operator,
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
      ...endpointParams,
      alternative: output.operator.includes('p') ? 'two-sided' : undefined,
      ...calculation.comparisonParameters,
    },
  }

  const label = generateDerivedNetworkLabel({
    catalogs: state.catalogs,
    ...labelParams(endpoints.left, endpoints.right),
    layerId: baseNetwork.context.layerId,
    measureId: baseNetwork.measureId,
    suffix: output.labelSuffix,
    useMinus: labelMode === 'minus',
  })

  const provenanceParameters = buildProvenanceParameters({
    operation: method.id,
    layerId: baseNetwork.context.layerId,
    measureId: baseNetwork.measureId,
    ...endpointParams,
    formula: calculation.formula,
    methodId: method.id,
    extra: calculation.provenanceExtra,
  })

  const source = {
    type: 'comparison' as const,
    left: endpointSource(state, endpoints.left),
    right: endpointSource(state, endpoints.right),
  }

  return createDerivedNetwork({
    id,
    label,
    context: baseNetwork.context,
    measureId: baseNetwork.measureId,
    nodeSetId: baseNetwork.nodeSetId,
    nodeIds: baseNetwork.nodeIds,
    symmetric:
      baseNetwork.data.format === 'matrix'
        ? baseNetwork.data.symmetric
        : !baseNetwork.data.directed,
    source,
    statisticId: output.statId,
    derivation,
    valueDomain: outputValueDomain(output),
    dependencies,
    provenanceParameters: {
      ...provenanceParameters,
      statisticMethod: calculation.statMethod,
      statisticParameters: calculation.statParameters ?? {},
    },
    data: calculation.data,
  })
}
