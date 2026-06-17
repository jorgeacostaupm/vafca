import {
  CheckSquareOutlined,
  ClearOutlined,
  DeleteOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useMemo, useState } from 'react'

import { DEFAULT_DERIVED_MATRIX_CALCULATION_TAB } from '@/config/ui'
import {
  type AggregatedNetworkOrderMode,
  buildNodeGroupsFromTags,
  getCurrentVisualizationGrouping,
  hashGroupOrder,
} from '@/networkDerivation/aggregation/nodeGroupAggregation'
import {
  getAvailableNetworkCalculations,
  getNetworkCalculationMethodDefinitions,
  type NetworkCalculationAssociatedOutputId,
  type NetworkCalculationOperation,
  resolveCalculationInputsForLayerMeasure,
} from '@/networkDerivation/calculations'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  computeAggregatedNetworkFromVisualizationGroups,
  computeDerivedNetworks,
  removeDatasetNetworks,
  selectDatasetData,
  selectDerivedCalculationError,
  selectDerivedCalculationStatus,
} from '@/store/slices/dataset'
import { pruneInvalidNetworkViews } from '@/store/slices/networkVisualization'
import { humanizeFieldName } from '@/utils/atlas/atlasDefinition'
import { createNetworkCompoundId } from '@/utils/networkMetadata'

type Props = {
  open: boolean
  onClose: () => void
  onOpenGroupingSettings?: () => void
  initialTab?: DerivedNetworkCalculationTab
}

export type DerivedNetworkCalculationTab = 'comparison' | 'aggregated'

type PreviewRow = {
  key: string
  method: string
  layer: string
  measure: string
  left: string
  right: string
  output: string
  status: string
}

const populationMethods: NetworkCalculationOperation[] = [
  'population_reference_zscore',
  'population_difference',
  'population_cohens_d',
  'population_two_sample_z_test',
  'population_welch_t',
]
const subjectMethods: NetworkCalculationOperation[] = [
  'subject_zscore_vs_population',
  'subject_difference',
]

const first = (values: string[]) => values[0] ?? ''
const formatGroupingFields = (fields: string[]) =>
  fields.map((field) => humanizeFieldName(field)).join(' -> ')

export default function DerivedNetworkCalculationModal({
  open,
  onClose,
  onOpenGroupingSettings,
  initialTab = DEFAULT_DERIVED_MATRIX_CALCULATION_TAB,
}: Props) {
  const dispatch = useAppDispatch()
  const dataset = useAppSelector(selectDatasetData)
  const atlasState = useAppSelector((state) => state.atlasUi)
  const selectedViewType = useAppSelector((state) => state.networkVisualization.controls.viewType)
  const calculationStatus = useAppSelector(selectDerivedCalculationStatus)
  const calculationError = useAppSelector(selectDerivedCalculationError)
  const datasetContent = dataset?.content
  const methods = useMemo(() => getNetworkCalculationMethodDefinitions(), [])
  const available = useMemo(
    () => (datasetContent ? getAvailableNetworkCalculations(datasetContent) : []),
    [datasetContent],
  )
  const availableIds = useMemo(() => new Set(available.map((method) => method.id)), [available])

  const populationIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.populations ?? {}),
    [datasetContent],
  )
  const subjectIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.subjects ?? {}),
    [datasetContent],
  )
  const layerIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.layers ?? {}),
    [datasetContent],
  )
  const measureIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.measures ?? {}),
    [datasetContent],
  )

  const [operations, setOperations] = useState<NetworkCalculationOperation[]>([])
  const [leftPopulationId, setLeftPopulationId] = useState(first(populationIds))
  const [rightPopulationId, setRightPopulationId] = useState(
    populationIds[1] ?? first(populationIds),
  )
  const [referencePopulationId, setReferencePopulationId] = useState(
    populationIds[1] ?? first(populationIds),
  )
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(subjectIds.slice(0, 1))
  const [rightSubjectId, setRightSubjectId] = useState(subjectIds[1] ?? first(subjectIds))
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(layerIds.slice(0, 1))
  const [selectedMeasureIds, setSelectedMeasureIds] = useState<string[]>(measureIds.slice(0, 1))
  const [associated, setAssociated] = useState<
    Record<string, NetworkCalculationAssociatedOutputId[]>
  >({})
  const [summary, setSummary] = useState<string | null>(null)
  const [aggregationSummary, setAggregationSummary] = useState<string | null>(null)
  const [aggregationWarnings, setAggregationWarnings] = useState<string[]>([])
  const [baseNetworkIds, setBaseNetworkIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<DerivedNetworkCalculationTab>(initialTab)
  const running = calculationStatus === 'loading'
  const aggregationOrderMode: AggregatedNetworkOrderMode =
    selectedViewType === 'circular' ? 'circular' : 'matrix'

  const effectiveLeftPopulationId = leftPopulationId || first(populationIds)
  const effectiveRightPopulationId = rightPopulationId || populationIds[1] || first(populationIds)
  const effectiveReferencePopulationId =
    referencePopulationId || populationIds[1] || first(populationIds)
  const effectiveSubjectIds = selectedSubjectIds.length
    ? selectedSubjectIds
    : subjectIds.slice(0, 1)
  const effectiveRightSubjectId = rightSubjectId || subjectIds[1] || first(subjectIds)
  const effectiveLayerIds = selectedLayerIds.length ? selectedLayerIds : layerIds.slice(0, 1)
  const effectiveMeasureIds = selectedMeasureIds.length
    ? selectedMeasureIds
    : measureIds.slice(0, 1)

  const hasSubjectOperation = operations.includes('subject_zscore_vs_population')
  const hasSubjectComparisonOperation = operations.includes('subject_difference')
  const hasPopulationOperation = operations.some((operation) =>
    populationMethods.includes(operation),
  )

  const request = useMemo(
    () => ({
      operations,
      leftPopulationId: effectiveLeftPopulationId,
      rightPopulationId: effectiveRightPopulationId,
      referencePopulationId: effectiveReferencePopulationId,
      rightSubjectId: effectiveRightSubjectId,
      subjectIds: effectiveSubjectIds,
      layerIds: effectiveLayerIds,
      measureIds: effectiveMeasureIds,
      selectedAssociatedOutputs: associated,
    }),
    [
      associated,
      effectiveLayerIds,
      effectiveLeftPopulationId,
      effectiveMeasureIds,
      effectiveReferencePopulationId,
      effectiveRightPopulationId,
      effectiveRightSubjectId,
      effectiveSubjectIds,
      operations,
    ],
  )

  const previewRows = useMemo<PreviewRow[]>(() => {
    if (!datasetContent) return []
    return operations.flatMap((operation) => {
      const definition = methods.find((method) => method.id === operation)
      const subjects = subjectMethods.includes(operation) ? effectiveSubjectIds : [undefined]
      return subjects.flatMap((subjectId) =>
        effectiveLayerIds.flatMap((layerId) =>
          effectiveMeasureIds.map((measureId) => {
            const resolved = resolveCalculationInputsForLayerMeasure(
              { ...request, operation },
              datasetContent,
              layerId,
              measureId,
              subjectId,
            )
            const layer = datasetContent.catalogs.layers[layerId]?.label ?? layerId
            const measure = datasetContent.catalogs.measures[measureId]?.label ?? measureId
            const left = subjectId
              ? (datasetContent.catalogs.subjects[subjectId]?.label ?? subjectId)
              : (datasetContent.catalogs.populations[effectiveLeftPopulationId]?.label ??
                effectiveLeftPopulationId)
            const right =
              operation === 'subject_difference'
                ? (datasetContent.catalogs.subjects[effectiveRightSubjectId]?.label ??
                  effectiveRightSubjectId)
                : (() => {
                    const rightId =
                      operation === 'population_reference_zscore' ||
                      operation === 'subject_zscore_vs_population'
                        ? effectiveReferencePopulationId
                        : effectiveRightPopulationId
                    return datasetContent.catalogs.populations[rightId]?.label ?? rightId
                  })()
            return {
              key: `${operation}:${subjectId ?? 'pop'}:${layerId}:${measureId}`,
              method: definition?.shortLabel ?? operation,
              layer,
              measure,
              left,
              right,
              output: definition?.outputs[0]?.statId ?? '',
              status: resolved.missingRoles.length
                ? `skipped: missing ${resolved.missingRoles.join(', ')}`
                : resolved.warnings.length
                  ? `ready with warnings`
                  : 'ready',
            }
          }),
        ),
      )
    })
  }, [
    datasetContent,
    effectiveLayerIds,
    effectiveLeftPopulationId,
    effectiveMeasureIds,
    effectiveReferencePopulationId,
    effectiveRightPopulationId,
    effectiveRightSubjectId,
    effectiveSubjectIds,
    methods,
    operations,
    request,
  ])

  const canCalculate =
    operations.length > 0 &&
    effectiveLayerIds.length > 0 &&
    effectiveMeasureIds.length > 0 &&
    previewRows.some((row) => row.status.startsWith('ready'))

  const groupConfig = useMemo(() => {
    const categoryOrder =
      aggregationOrderMode === 'circular'
        ? atlasState.circularHierarchyCategoryOrder
        : atlasState.matrixHierarchyCategoryOrder
    return getCurrentVisualizationGrouping(atlasState.colorFields, categoryOrder)
  }, [
    aggregationOrderMode,
    atlasState.circularHierarchyCategoryOrder,
    atlasState.colorFields,
    atlasState.matrixHierarchyCategoryOrder,
  ])
  const activeNodeIds = useMemo(
    () => atlasState.order.filter((id) => atlasState.labelsById[id]?.enabled !== false),
    [atlasState.labelsById, atlasState.order],
  )
  const inactiveNodeIds = useMemo(
    () => atlasState.order.filter((id) => atlasState.labelsById[id]?.enabled === false),
    [atlasState.labelsById, atlasState.order],
  )
  const aggregationBaseNetworks = useMemo(
    () =>
      (datasetContent?.networks ?? []).filter(
        (network) => network.derivation?.type !== 'aggregation',
      ),
    [datasetContent?.networks],
  )
  const groupPreview = useMemo(() => {
    if (!datasetContent || !groupConfig) return null
    return buildNodeGroupsFromTags({
      nodeSet: datasetContent.nodeSet,
      fields: groupConfig.fields,
      categoryOrder: groupConfig.categoryOrder,
      activeNodeIds: new Set(activeNodeIds),
      missingTagPolicy: groupConfig.missingTagPolicy,
    })
  }, [activeNodeIds, datasetContent, groupConfig])
  const aggregationMismatchNetworkIds = useMemo(() => {
    if (!datasetContent) return []

    const aggregatedNetworks = datasetContent.networks.filter(
      (network) => network.derivation?.type === 'aggregation',
    )
    if (!groupConfig || !groupPreview) {
      return aggregatedNetworks.map((network) => network.id)
    }

    const currentGroupOrderHash = hashGroupOrder(groupPreview.groups.map((group) => group.id))

    return aggregatedNetworks
      .filter((network) => {
        const aggregation = network.derivation
        if (aggregation?.type !== 'aggregation') return true

        const sameFields =
          aggregation.fields.length === groupConfig.fields.length &&
          aggregation.fields.every((field, index) => field === groupConfig.fields[index])
        const sameMissingPolicy =
          aggregation.parameters.missingNodePolicy === groupConfig.missingTagPolicy
        const sameGroupOrder = aggregation.parameters.groupOrderHash === currentGroupOrderHash

        return !(sameFields && sameMissingPolicy && sameGroupOrder)
      })
      .map((network) => network.id)
  }, [datasetContent, groupConfig, groupPreview])
  const canAggregate =
    Boolean(groupConfig) && baseNetworkIds.length > 0 && (groupPreview?.groups.length ?? 0) >= 2

  const handleCalculate = async () => {
    setSummary(null)
    try {
      const result = await dispatch(computeDerivedNetworks(request)).unwrap()
      setSummary(
        `Created ${result.networks.length} networks. Skipped ${result.skipped.length} combinations. Reused ${result.existing.length} existing networks.`,
      )
    } catch {
      // The slice stores and exposes the user-facing error.
    }
  }

  const handleAggregate = async () => {
    setAggregationSummary(null)
    setAggregationWarnings([])
    try {
      const result = await dispatch(
        computeAggregatedNetworkFromVisualizationGroups({
          baseNetworkIds,
          orderMode: aggregationOrderMode,
        }),
      ).unwrap()
      setAggregationSummary(
        `Created ${result.networks.length} aggregated networks. Reused ${result.existing.length} existing aggregated networks.`,
      )
      setAggregationWarnings(result.warnings)
    } catch {
      // The slice stores and exposes the user-facing error.
    }
  }

  const handleDeleteAggregationMismatchNetworks = useCallback(() => {
    if (!datasetContent || aggregationMismatchNetworkIds.length === 0) return

    const deletedIds = new Set(aggregationMismatchNetworkIds)
    const validCompoundIds = datasetContent.networks
      .filter((network) => !deletedIds.has(network.id))
      .map(createNetworkCompoundId)

    dispatch(removeDatasetNetworks({ networkIds: aggregationMismatchNetworkIds }))
    void dispatch(
      pruneInvalidNetworkViews({
        validCompoundIds,
        enabled: true,
      }),
    )
    setAggregationSummary(
      `Deleted ${aggregationMismatchNetworkIds.length} aggregated networks with a different grouping.`,
    )
  }, [aggregationMismatchNetworkIds, datasetContent, dispatch])

  const methodOptions = methods.filter((method) => availableIds.has(method.id))
  const columns: ColumnsType<PreviewRow> = [
    { title: 'Method', dataIndex: 'method' },
    { title: 'Layer', dataIndex: 'layer' },
    { title: 'Measure', dataIndex: 'measure' },
    { title: 'Left/Target', dataIndex: 'left' },
    { title: 'Right/Control', dataIndex: 'right' },
    { title: 'Output stat', dataIndex: 'output' },
    { title: 'Status', dataIndex: 'status' },
  ]
  const primaryAction =
    activeTab === 'comparison'
      ? {
          label: running ? 'Comparing...' : 'Compare',
          disabled: !canCalculate || running,
          onClick: handleCalculate,
        }
      : {
          label: running ? 'Aggregating...' : 'Aggregate',
          disabled: !canAggregate || running,
          onClick: handleAggregate,
        }

  return (
    <Modal title="Compute Networks" open={open} onCancel={onClose} width={1100} footer={null}>
      <div className="compute-networks">
        {calculationError ? <Alert type="error" showIcon message={calculationError} /> : null}
        <Tabs
          activeKey={activeTab}
          destroyOnHidden
          onChange={(key) => setActiveTab(key as DerivedNetworkCalculationTab)}
          items={[
            {
              key: 'comparison',
              label: 'Comparison',
              children: (
                <div className="compute-networks__tab">
                  <section className="compute-networks__section">
                    <div className="compute-networks__section-header">
                      <Typography.Text type="secondary">
                        Create derived comparison networks from subjects, populations, layers,
                        measures, and statistics.
                      </Typography.Text>
                    </div>
                    {methodOptions.length === 0 ? (
                      <Alert
                        type="warning"
                        showIcon
                        message="No derived network calculations are available with the currently loaded data."
                      />
                    ) : null}

                    <Form layout="vertical">
                      <Form.Item label="Methods">
                        <Space direction="vertical" size={8}>
                          {methodOptions.map((method) => (
                            <div key={method.id}>
                              <Checkbox
                                checked={operations.includes(method.id)}
                                onChange={(event) => {
                                  setOperations((current) =>
                                    event.target.checked
                                      ? [...current, method.id]
                                      : current.filter((id) => id !== method.id),
                                  )
                                }}
                              >
                                {method.label}
                              </Checkbox>
                              <Tooltip
                                title={`${method.description} Formula: ${method.formulaText} Requirements: ${method.requirements.join('; ')}`}
                              >
                                <InfoCircleOutlined className="compute-networks__method-info" />
                              </Tooltip>
                              {operations.includes(method.id) &&
                              method.associatedOutputs?.length ? (
                                <Checkbox.Group
                                  className="compute-networks__associated-outputs"
                                  value={associated[method.id] ?? []}
                                  options={method.associatedOutputs.map((output) => ({
                                    value: output.id,
                                    label: output.label,
                                  }))}
                                  onChange={(values) =>
                                    setAssociated((current) => ({
                                      ...current,
                                      [method.id]: values as NetworkCalculationAssociatedOutputId[],
                                    }))
                                  }
                                />
                              ) : null}
                            </div>
                          ))}
                        </Space>
                      </Form.Item>

                      <div className="compute-networks__control-stack">
                        <div className="compute-networks__control-row">
                          {hasPopulationOperation ? (
                            <>
                              <Form.Item label="Left / target population">
                                <Select
                                  className="compute-networks__select"
                                  value={effectiveLeftPopulationId}
                                  onChange={setLeftPopulationId}
                                  options={populationIds.map((id) => ({
                                    value: id,
                                    label: datasetContent?.catalogs.populations[id]?.label ?? id,
                                  }))}
                                />
                              </Form.Item>
                              <Form.Item label="Right / control population">
                                <Select
                                  className="compute-networks__select"
                                  value={effectiveRightPopulationId}
                                  onChange={(value) => {
                                    setRightPopulationId(value)
                                    setReferencePopulationId(value)
                                  }}
                                  options={populationIds.map((id) => ({
                                    value: id,
                                    label: datasetContent?.catalogs.populations[id]?.label ?? id,
                                  }))}
                                />
                              </Form.Item>
                              <Form.Item label="Direction">
                                <Button
                                  icon={<SwapOutlined />}
                                  onClick={() => {
                                    setLeftPopulationId(effectiveRightPopulationId)
                                    setRightPopulationId(effectiveLeftPopulationId)
                                    setReferencePopulationId(effectiveLeftPopulationId)
                                  }}
                                >
                                  Swap direction
                                </Button>
                              </Form.Item>
                            </>
                          ) : null}

                          {hasSubjectOperation || hasSubjectComparisonOperation ? (
                            <Form.Item
                              label={hasSubjectComparisonOperation ? 'Left subjects' : 'Subjects'}
                            >
                              <Select
                                mode="multiple"
                                className="compute-networks__select compute-networks__select--wide"
                                value={effectiveSubjectIds}
                                onChange={setSelectedSubjectIds}
                                options={subjectIds.map((id) => ({
                                  value: id,
                                  label: datasetContent?.catalogs.subjects[id]?.label ?? id,
                                }))}
                              />
                            </Form.Item>
                          ) : null}
                          {hasSubjectOperation ? (
                            <Form.Item label="Reference population">
                              <Select
                                className="compute-networks__select"
                                value={effectiveReferencePopulationId}
                                onChange={setReferencePopulationId}
                                options={populationIds.map((id) => ({
                                  value: id,
                                  label: datasetContent?.catalogs.populations[id]?.label ?? id,
                                }))}
                              />
                            </Form.Item>
                          ) : null}
                          {hasSubjectComparisonOperation ? (
                            <>
                              <Form.Item label="Right / control subject">
                                <Select
                                  className="compute-networks__select"
                                  value={effectiveRightSubjectId}
                                  onChange={setRightSubjectId}
                                  options={subjectIds.map((id) => ({
                                    value: id,
                                    label: datasetContent?.catalogs.subjects[id]?.label ?? id,
                                  }))}
                                />
                              </Form.Item>
                              <Form.Item label="Direction">
                                <Button
                                  icon={<SwapOutlined />}
                                  onClick={() => {
                                    setSelectedSubjectIds([effectiveRightSubjectId])
                                    setRightSubjectId(
                                      effectiveSubjectIds[0] ?? effectiveRightSubjectId,
                                    )
                                  }}
                                >
                                  Swap direction
                                </Button>
                              </Form.Item>
                            </>
                          ) : null}
                        </div>

                        <div className="compute-networks__control-row">
                          <Form.Item label="Layers">
                            <Select
                              mode="multiple"
                              className="compute-networks__select compute-networks__select--xwide"
                              value={effectiveLayerIds}
                              onChange={setSelectedLayerIds}
                              options={layerIds.map((id) => ({
                                value: id,
                                label: datasetContent?.catalogs.layers[id]?.label ?? id,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item label="Measures">
                            <Select
                              mode="multiple"
                              className="compute-networks__select compute-networks__select--xwide"
                              value={effectiveMeasureIds}
                              onChange={setSelectedMeasureIds}
                              options={measureIds.map((id) => ({
                                value: id,
                                label: datasetContent?.catalogs.measures[id]?.label ?? id,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item className="compute-networks__compare-action" label=" ">
                            <Button
                              type="primary"
                              icon={<PlayCircleOutlined />}
                              loading={running}
                              disabled={primaryAction.disabled}
                              onClick={primaryAction.onClick}
                            >
                              {primaryAction.label}
                            </Button>
                          </Form.Item>
                        </div>
                      </div>
                    </Form>
                  </section>

                  <section className="compute-networks__section">
                    <div className="compute-networks__section-header">
                      <div>
                        <Typography.Title level={5}>Preview</Typography.Title>
                        <Typography.Text type="secondary">
                          Review the networks that will be created or skipped.
                        </Typography.Text>
                      </div>
                    </div>
                    {summary ? <Alert type="success" showIcon message={summary} /> : null}
                    <Table
                      size="small"
                      columns={columns}
                      dataSource={previewRows}
                      pagination={{ pageSize: 6 }}
                    />
                  </section>
                </div>
              ),
            },
            {
              key: 'aggregated',
              label: 'Aggregation',
              children: (
                <div className="compute-networks__tab">
                  <section className="compute-networks__section">
                    <div className="compute-networks__section-header">
                      <div className="compute-networks__aggregation-copy">
                        <Typography.Text type="secondary">
                          Generate aggregated networks using the active grouping:{' '}
                          {groupConfig ? formatGroupingFields(groupConfig.fields) : 'No grouping'}
                        </Typography.Text>
                      </div>
                    </div>
                    <div className="compute-networks__grouping-status">
                      {onOpenGroupingSettings ? (
                        <Button
                          icon={<ExportOutlined />}
                          size="small"
                          onClick={onOpenGroupingSettings}
                        >
                          Group networks
                        </Button>
                      ) : null}
                    </div>
                    {inactiveNodeIds.length > 0 ? (
                      <Alert
                        type="warning"
                        showIcon
                        message={`Inactive nodes excluded: ${inactiveNodeIds.length}`}
                        description={inactiveNodeIds.slice(0, 12).join(', ')}
                      />
                    ) : null}
                    <Form layout="vertical">
                      <Form.Item label="Base network">
                        <Space direction="vertical" size={8} className="compute-networks__full">
                          <Space wrap>
                            <Button
                              size="small"
                              icon={<CheckSquareOutlined />}
                              disabled={!groupConfig || aggregationBaseNetworks.length === 0}
                              onClick={() => {
                                setBaseNetworkIds(
                                  aggregationBaseNetworks.map((network) => network.id),
                                )
                              }}
                            >
                              Select all
                            </Button>
                            <Button
                              size="small"
                              icon={<ClearOutlined />}
                              disabled={!groupConfig || baseNetworkIds.length === 0}
                              onClick={() => setBaseNetworkIds([])}
                            >
                              Clear all
                            </Button>
                            <Typography.Text type="secondary">
                              {baseNetworkIds.length} / {aggregationBaseNetworks.length} selected
                            </Typography.Text>
                          </Space>
                          <Select
                            mode="multiple"
                            className="compute-networks__full"
                            value={baseNetworkIds}
                            disabled={!groupConfig}
                            onChange={setBaseNetworkIds}
                            placeholder="Select one or more node-to-node base networks"
                            options={aggregationBaseNetworks.map((network) => ({
                              value: network.id,
                              label: network.label ?? network.id,
                            }))}
                          />
                        </Space>
                      </Form.Item>
                    </Form>
                    {aggregationMismatchNetworkIds.length > 0 ? (
                      <Alert
                        className="compute-networks__compact-warning"
                        type="warning"
                        showIcon
                        message={`${aggregationMismatchNetworkIds.length} aggregated network${aggregationMismatchNetworkIds.length === 1 ? ' uses' : ' networks use'} a different grouping.`}
                        description="Kept as snapshots; they will not be recalculated when grouping changes."
                        action={
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleDeleteAggregationMismatchNetworks}
                          >
                            Delete all
                          </Button>
                        }
                      />
                    ) : null}
                    <div className="compute-networks__section-actions">
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        loading={running}
                        disabled={primaryAction.disabled}
                        onClick={primaryAction.onClick}
                      >
                        {primaryAction.label}
                      </Button>
                    </div>
                  </section>

                  <section className="compute-networks__section">
                    <div className="compute-networks__section-header">
                      <div>
                        <Typography.Title level={5}>Results</Typography.Title>
                        <Typography.Text type="secondary">
                          Review the aggregation output and warnings from the last run.
                        </Typography.Text>
                      </div>
                    </div>
                    {aggregationSummary ? (
                      <Alert type="success" showIcon message={aggregationSummary} />
                    ) : (
                      <Typography.Text type="secondary">
                        No aggregation has been computed in this session.
                      </Typography.Text>
                    )}
                    {aggregationWarnings.map((warning) => (
                      <Alert key={warning} type="warning" showIcon message={warning} />
                    ))}
                  </section>
                </div>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  )
}
