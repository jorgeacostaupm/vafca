import {
  buildProvenanceParameters,
  createDerivedMatrix,
  generateDerivedMatrixId,
  generateDerivedMatrixLabel,
  outputValueDomain,
  populationLabel,
  subjectLabel,
} from '@/networkDerivation/calculations/records'
import type {
  MatrixCalculationBatchRequest,
  MatrixCalculationMethodDefinition,
  MatrixCalculationOutputSpec,
  MatrixCalculationState,
} from '@/networkDerivation/calculations/types'
import type {
  ComparisonSideSource,
  ConnectivityMatrix,
  MatrixCellValue,
  MatrixComparison,
} from '@/types/connectivityBundle'

type ComparisonRecordRuntime = {
  state: MatrixCalculationState
  request: MatrixCalculationBatchRequest
  existingIds: Set<string>
}

type SubjectEndpoint = {
  type: 'subject'
  subjectId: string
  matrix: ConnectivityMatrix
}

type PopulationEndpoint = {
  type: 'population'
  populationId?: string
  matrix: ConnectivityMatrix
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

type CreateComparisonMatrixParams = {
  runtime: ComparisonRecordRuntime
  method: MatrixCalculationMethodDefinition
  output: MatrixCalculationOutputSpec
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

const endpointLabel = (state: MatrixCalculationState, endpoint: ComparisonEndpoint) =>
  endpoint.type === 'subject'
    ? subjectLabel(state.catalogs, endpoint.subjectId)
    : populationLabel(state.catalogs, endpoint.populationId)

const endpointSource = (
  state: MatrixCalculationState,
  endpoint: ComparisonEndpoint,
): ComparisonSideSource =>
  endpoint.type === 'subject'
    ? {
        level: 'subject',
        subjectId: endpoint.subjectId,
        label: endpointLabel(state, endpoint),
      }
    : {
        level: 'population',
        populationIds: endpoint.populationId ? [endpoint.populationId] : [],
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

export const createComparisonMatrix = ({
  runtime,
  method,
  output,
  endpoints,
  dependencies,
  calculation,
  labelMode = 'vs',
}: CreateComparisonMatrixParams) => {
  const { state, request, existingIds } = runtime
  const baseMatrix = endpoints.left.matrix
  const ids = {
    left: endpointId(endpoints.left),
    right: endpointId(endpoints.right),
  }
  const id = generateDerivedMatrixId({
    prefix: request.outputIdPrefix,
    leftId: ids.left,
    rightId: ids.right,
    subjectId: endpoints.left.type === 'subject' ? endpoints.left.subjectId : undefined,
    layerId: baseMatrix.context.layerId,
    measureId: baseMatrix.context.measureId,
    operator: output.operator,
    existingIds,
  })
  existingIds.add(id)

  const endpointParams = endpointComparisonParameters(endpoints.left, endpoints.right)
  const comparison: MatrixComparison = {
    operator: output.operator,
    comparisonType: output.comparisonType,
    formula: calculation.formula,
    leftMatrixId: endpoints.left.matrix.id,
    rightMatrixId: endpoints.right.matrix.id,
    parameters: {
      methodId: method.id,
      ...endpointParams,
      alternative: output.operator.includes('p') ? 'two-sided' : undefined,
      ...calculation.comparisonParameters,
    },
  }

  const label = generateDerivedMatrixLabel({
    catalogs: state.catalogs,
    ...labelParams(endpoints.left, endpoints.right),
    layerId: baseMatrix.context.layerId,
    measureId: baseMatrix.context.measureId,
    suffix: output.labelSuffix,
    useMinus: labelMode === 'minus',
  })

  const provenanceParameters = buildProvenanceParameters({
    operation: method.id,
    layerId: baseMatrix.context.layerId,
    measureId: baseMatrix.context.measureId,
    ...endpointParams,
    formula: calculation.formula,
    methodId: method.id,
    extra: calculation.provenanceExtra,
  })

  const source = {
    level: 'comparison' as const,
    left: endpointSource(state, endpoints.left),
    right: endpointSource(state, endpoints.right),
  }

  const stat = {
    id: output.statId,
    method: calculation.statMethod,
    parameters: calculation.statParameters ?? {},
  }

  return createDerivedMatrix({
    id,
    label,
    context: baseMatrix.context,
    geometry: baseMatrix.geometry,
    symmetric: baseMatrix.encoding.symmetric,
    source,
    stat,
    comparison,
    valueDomain: outputValueDomain(output),
    dependencies,
    provenanceParameters,
    data: calculation.data,
  })
}
