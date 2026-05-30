import { useMemo, useState } from "react";
import { InfoCircleOutlined, SwapOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  Form,
  Modal,
  Select,
  Space,
  Tabs,
  Table,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { DEFAULT_DERIVED_MATRIX_CALCULATION_TAB } from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  computeAggregatedMatrixFromVisualizationGroups,
  computeDerivedMatrices,
  selectDerivedCalculationError,
  selectDerivedCalculationStatus,
  selectDatasetData,
} from "@/store/slices/dataset";
import {
  type AggregatedMatrixOrderMode,
  buildRoiGroupsFromTags,
  getCurrentVisualizationGrouping,
  hashRoiSet,
} from "@/connectivity/aggregation/roiGroupAggregation";
import {
  getAvailableMatrixCalculations,
  getMatrixCalculationMethodDefinitions,
  resolveCalculationInputsForLayerMeasure,
  type MatrixCalculationAssociatedOutputId,
  type MatrixCalculationOperation,
} from "@/connectivity/calculations";

type Props = {
  open: boolean;
  onClose: () => void;
  onOpenGroupingSettings?: () => void;
};

type PreviewRow = {
  key: string;
  method: string;
  layer: string;
  measure: string;
  left: string;
  right: string;
  output: string;
  status: string;
};

const populationMethods: MatrixCalculationOperation[] = [
  "population_reference_zscore",
  "population_difference",
  "population_cohens_d",
  "population_two_sample_z_test",
  "population_welch_t",
];
const subjectMethods: MatrixCalculationOperation[] = [
  "subject_zscore_vs_population",
  "subject_difference",
];

const first = (values: string[]) => values[0] ?? "";

export default function DerivedMatrixCalculationModal({
  open,
  onClose,
  onOpenGroupingSettings,
}: Props) {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector(selectDatasetData);
  const atlasState = useAppSelector((state) => state.atlasUi);
  const selectedViewType = useAppSelector(
    (state) => state.networkVisualization.controls.viewType,
  );
  const calculationStatus = useAppSelector(selectDerivedCalculationStatus);
  const calculationError = useAppSelector(selectDerivedCalculationError);
  const datasetContent = dataset?.content;
  const methods = useMemo(() => getMatrixCalculationMethodDefinitions(), []);
  const available = useMemo(
    () => (datasetContent ? getAvailableMatrixCalculations(datasetContent) : []),
    [datasetContent],
  );
  const availableIds = useMemo(
    () => new Set(available.map((method) => method.id)),
    [available],
  );

  const populationIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.populations ?? {}),
    [datasetContent],
  );
  const subjectIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.subjects ?? {}),
    [datasetContent],
  );
  const layerIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.layers ?? {}),
    [datasetContent],
  );
  const measureIds = useMemo(
    () => Object.keys(datasetContent?.catalogs.measures ?? {}),
    [datasetContent],
  );

  const [operations, setOperations] = useState<MatrixCalculationOperation[]>(
    [],
  );
  const [leftPopulationId, setLeftPopulationId] = useState(
    first(populationIds),
  );
  const [rightPopulationId, setRightPopulationId] = useState(
    populationIds[1] ?? first(populationIds),
  );
  const [referencePopulationId, setReferencePopulationId] = useState(
    populationIds[1] ?? first(populationIds),
  );
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    subjectIds.slice(0, 1),
  );
  const [rightSubjectId, setRightSubjectId] = useState(
    subjectIds[1] ?? first(subjectIds),
  );
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(
    layerIds.slice(0, 1),
  );
  const [selectedMeasureIds, setSelectedMeasureIds] = useState<string[]>(
    measureIds.slice(0, 1),
  );
  const [associated, setAssociated] = useState<
    Record<string, MatrixCalculationAssociatedOutputId[]>
  >({});
  const [summary, setSummary] = useState<string | null>(null);
  const [aggregationSummary, setAggregationSummary] = useState<string | null>(
    null,
  );
  const [aggregationWarnings, setAggregationWarnings] = useState<string[]>([]);
  const [baseMatrixIds, setBaseMatrixIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"comparison" | "aggregated">(
    DEFAULT_DERIVED_MATRIX_CALCULATION_TAB,
  );
  const running = calculationStatus === "loading";
  const aggregationOrderMode: AggregatedMatrixOrderMode =
    selectedViewType === "circular" ? "circular" : "matrix";

  const effectiveLeftPopulationId = leftPopulationId || first(populationIds);
  const effectiveRightPopulationId =
    rightPopulationId || populationIds[1] || first(populationIds);
  const effectiveReferencePopulationId =
    referencePopulationId || populationIds[1] || first(populationIds);
  const effectiveSubjectIds = selectedSubjectIds.length
    ? selectedSubjectIds
    : subjectIds.slice(0, 1);
  const effectiveRightSubjectId =
    rightSubjectId || subjectIds[1] || first(subjectIds);
  const effectiveLayerIds = selectedLayerIds.length
    ? selectedLayerIds
    : layerIds.slice(0, 1);
  const effectiveMeasureIds = selectedMeasureIds.length
    ? selectedMeasureIds
    : measureIds.slice(0, 1);

  const hasSubjectOperation = operations.includes(
    "subject_zscore_vs_population",
  );
  const hasSubjectComparisonOperation = operations.includes("subject_difference");
  const hasPopulationOperation = operations.some((operation) =>
    populationMethods.includes(operation),
  );

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
  );

  const previewRows = useMemo<PreviewRow[]>(() => {
    if (!datasetContent) return [];
    return operations.flatMap((operation) => {
      const definition = methods.find((method) => method.id === operation);
      const subjects = subjectMethods.includes(operation)
          ? effectiveSubjectIds
          : [undefined];
      return subjects.flatMap((subjectId) =>
        effectiveLayerIds.flatMap((layerId) =>
          effectiveMeasureIds.map((measureId) => {
            const resolved = resolveCalculationInputsForLayerMeasure(
              { ...request, operation },
              datasetContent,
              layerId,
              measureId,
              subjectId,
            );
            const layer = datasetContent.catalogs.layers[layerId]?.label ?? layerId;
            const measure =
              datasetContent.catalogs.measures[measureId]?.label ?? measureId;
            const left = subjectId
              ? (datasetContent.catalogs.subjects[subjectId]?.label ?? subjectId)
              : (datasetContent.catalogs.populations[effectiveLeftPopulationId]
                  ?.label ?? effectiveLeftPopulationId);
            const right =
              operation === "subject_difference"
                ? (datasetContent.catalogs.subjects[effectiveRightSubjectId]?.label ??
                  effectiveRightSubjectId)
                : (() => {
                    const rightId =
                      operation === "population_reference_zscore" ||
                      operation === "subject_zscore_vs_population"
                        ? effectiveReferencePopulationId
                        : effectiveRightPopulationId;
                    return datasetContent.catalogs.populations[rightId]?.label ?? rightId;
                  })();
            return {
              key: `${operation}:${subjectId ?? "pop"}:${layerId}:${measureId}`,
              method: definition?.shortLabel ?? operation,
              layer,
              measure,
              left,
              right,
              output: definition?.outputs[0]?.statId ?? "",
              status: resolved.missingRoles.length
                ? `skipped: missing ${resolved.missingRoles.join(", ")}`
                : resolved.warnings.length
                  ? `ready with warnings`
                  : "ready",
            };
          }),
        ),
      );
    });
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
  ]);

  const canCalculate =
    operations.length > 0 &&
    effectiveLayerIds.length > 0 &&
    effectiveMeasureIds.length > 0 &&
    previewRows.some((row) => row.status.startsWith("ready"));

  const groupConfig = useMemo(() => {
    const categoryOrder =
      aggregationOrderMode === "circular"
        ? atlasState.circularHierarchyCategoryOrder
        : atlasState.matrixHierarchyCategoryOrder;
    return getCurrentVisualizationGrouping(
      atlasState.colorFields,
      categoryOrder,
    );
  }, [
    aggregationOrderMode,
    atlasState.circularHierarchyCategoryOrder,
    atlasState.colorFields,
    atlasState.matrixHierarchyCategoryOrder,
  ]);
  const activeRoiIds = useMemo(
    () =>
      atlasState.order.filter(
        (id) => atlasState.labelsById[id]?.enabled !== false,
      ),
    [atlasState.labelsById, atlasState.order],
  );
  const inactiveRoiIds = useMemo(
    () =>
      atlasState.order.filter(
        (id) => atlasState.labelsById[id]?.enabled === false,
      ),
    [atlasState.labelsById, atlasState.order],
  );
  const aggregationBaseMatrices = useMemo(
    () =>
      (datasetContent?.matrices ?? []).filter((matrix) =>
        ["subject", "aggregate", "comparison"].includes(matrix.kind),
      ),
    [datasetContent?.matrices],
  );
  const groupPreview = useMemo(() => {
    if (!datasetContent || !groupConfig) return null;
    return buildRoiGroupsFromTags({
      atlas: datasetContent.atlas,
      fields: groupConfig.fields,
      categoryOrder: groupConfig.categoryOrder,
      activeRoiIds: new Set(activeRoiIds),
      missingTagPolicy: groupConfig.missingTagPolicy,
    });
  }, [activeRoiIds, datasetContent, groupConfig]);
  const staleReducedCount = useMemo(() => {
    if (!datasetContent) return 0;
    const currentHash = hashRoiSet(activeRoiIds);
    return datasetContent.matrices.filter(
      (matrix) =>
        matrix.kind === "reduced" &&
        matrix.reduction?.activeRoiSetHash &&
        matrix.reduction.activeRoiSetHash !== currentHash,
    ).length;
  }, [activeRoiIds, datasetContent]);
  const canAggregate =
    Boolean(groupConfig) &&
    baseMatrixIds.length > 0 &&
    (groupPreview?.groups.length ?? 0) >= 2;

  const handleCalculate = async () => {
    setSummary(null);
    try {
      const result = await dispatch(computeDerivedMatrices(request)).unwrap();
      setSummary(
        `Created ${result.matrices.length} matrices. Skipped ${result.skipped.length} combinations. Reused ${result.existing.length} existing matrices.`,
      );
    } catch {
      // The slice stores and exposes the user-facing error.
    }
  };

  const handleAggregate = async () => {
    setAggregationSummary(null);
    setAggregationWarnings([]);
    try {
      const result = await dispatch(
        computeAggregatedMatrixFromVisualizationGroups({
          baseMatrixIds,
          orderMode: aggregationOrderMode,
        }),
      ).unwrap();
      setAggregationSummary(
        `Created ${result.matrices.length} aggregated matrices. Reused ${result.existing.length} existing aggregated matrices.`,
      );
      setAggregationWarnings(result.warnings);
    } catch {
      // The slice stores and exposes the user-facing error.
    }
  };

  const methodOptions = methods.filter((method) => availableIds.has(method.id));
  const columns: ColumnsType<PreviewRow> = [
    { title: "Method", dataIndex: "method" },
    { title: "Layer", dataIndex: "layer" },
    { title: "Measure", dataIndex: "measure" },
    { title: "Left/Target", dataIndex: "left" },
    { title: "Right/Control", dataIndex: "right" },
    { title: "Output stat", dataIndex: "output" },
    { title: "Status", dataIndex: "status" },
  ];
  const primaryAction =
    activeTab === "comparison"
      ? {
          label: running ? "Calculating..." : "Calculate",
          disabled: !canCalculate || running,
          onClick: handleCalculate,
        }
      : {
          label: running ? "Computing..." : "Compute aggregated matrix",
          disabled: !canAggregate || running,
          onClick: handleAggregate,
        };

  return (
    <Modal
      title="Compute Derived Networks"
      open={open}
      onCancel={onClose}
      width={1100}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="calculate"
          type="primary"
          loading={running}
          disabled={primaryAction.disabled}
          onClick={primaryAction.onClick}
        >
          {primaryAction.label}
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          Calculations run on loaded validated matrices and create runtime
          derived matrices.
        </Typography.Text>
        {calculationError ? (
          <Alert type="error" showIcon message={calculationError} />
        ) : null}
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as "comparison" | "aggregated")}
          items={[
            {
              key: "comparison",
              label: "Comparison",
              children: (
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Typography.Text type="secondary">
                    Create derived comparison matrices from subjects,
                    populations, layers, measures, and statistics.
                  </Typography.Text>
                  {summary ? (
                    <Alert type="success" showIcon message={summary} />
                  ) : null}
                  {methodOptions.length === 0 ? (
                    <Alert
                      type="warning"
                      showIcon
                      message="No derived matrix calculations are available with the currently loaded data."
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
                                );
                              }}
                            >
                              {method.label}
                            </Checkbox>
                            <Tooltip
                              title={`${method.description} Formula: ${method.formulaText} Requirements: ${method.requirements.join("; ")}`}
                            >
                              <InfoCircleOutlined style={{ marginLeft: 8 }} />
                            </Tooltip>
                            {operations.includes(method.id) &&
                            method.associatedOutputs?.length ? (
                              <Checkbox.Group
                                style={{
                                  display: "block",
                                  margin: "8px 0 0 24px",
                                }}
                                value={associated[method.id] ?? []}
                                options={method.associatedOutputs.map(
                                  (output) => ({
                                    value: output.id,
                                    label: output.label,
                                  }),
                                )}
                                onChange={(values) =>
                                  setAssociated((current) => ({
                                    ...current,
                                    [method.id]:
                                      values as MatrixCalculationAssociatedOutputId[],
                                  }))
                                }
                              />
                            ) : null}
                          </div>
                        ))}
                      </Space>
                    </Form.Item>

                    <Space size={16} align="start" wrap>
                      {hasPopulationOperation ? (
                        <>
                          <Form.Item label="Left / target population">
                            <Select
                              style={{ width: 220 }}
                              value={effectiveLeftPopulationId}
                              onChange={setLeftPopulationId}
                              options={populationIds.map((id) => ({
                                value: id,
                                label:
                                  datasetContent?.catalogs.populations[id]
                                    ?.label ?? id,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item label="Right / control population">
                            <Select
                              style={{ width: 220 }}
                              value={effectiveRightPopulationId}
                              onChange={(value) => {
                                setRightPopulationId(value);
                                setReferencePopulationId(value);
                              }}
                              options={populationIds.map((id) => ({
                                value: id,
                                label:
                                  datasetContent?.catalogs.populations[id]
                                    ?.label ?? id,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item label="Direction">
                            <Button
                              icon={<SwapOutlined />}
                              onClick={() => {
                                setLeftPopulationId(effectiveRightPopulationId);
                                setRightPopulationId(effectiveLeftPopulationId);
                                setReferencePopulationId(
                                  effectiveLeftPopulationId,
                                );
                              }}
                            >
                              Swap direction
                            </Button>
                          </Form.Item>
                        </>
                      ) : null}

                      {hasSubjectOperation || hasSubjectComparisonOperation ? (
                        <>
                          <Form.Item label={hasSubjectComparisonOperation ? "Left subjects" : "Subjects"}>
                            <Select
                              mode="multiple"
                              style={{ width: 260 }}
                              value={effectiveSubjectIds}
                              onChange={setSelectedSubjectIds}
                              options={subjectIds.map((id) => ({
                                value: id,
                                label:
                                  datasetContent?.catalogs.subjects[id]?.label ??
                                  id,
                              }))}
                            />
                          </Form.Item>
                        </>
                      ) : null}
                      {hasSubjectOperation ? (
                        <>
                          <Form.Item label="Reference population">
                            <Select
                              style={{ width: 220 }}
                              value={effectiveReferencePopulationId}
                              onChange={setReferencePopulationId}
                              options={populationIds.map((id) => ({
                                value: id,
                                label:
                                  datasetContent?.catalogs.populations[id]
                                    ?.label ?? id,
                              }))}
                            />
                          </Form.Item>
                        </>
                      ) : null}
                      {hasSubjectComparisonOperation ? (
                        <>
                          <Form.Item label="Right / control subject">
                            <Select
                              style={{ width: 220 }}
                              value={effectiveRightSubjectId}
                              onChange={setRightSubjectId}
                              options={subjectIds.map((id) => ({
                                value: id,
                                label:
                                  datasetContent?.catalogs.subjects[id]?.label ??
                                  id,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item label="Direction">
                            <Button
                              icon={<SwapOutlined />}
                              onClick={() => {
                                setSelectedSubjectIds([effectiveRightSubjectId]);
                                setRightSubjectId(effectiveSubjectIds[0] ?? effectiveRightSubjectId);
                              }}
                            >
                              Swap direction
                            </Button>
                          </Form.Item>
                        </>
                      ) : null}
                    </Space>

                    <Space size={16} align="start" wrap>
                      <Form.Item label="Layers">
                        <Select
                          mode="multiple"
                          style={{ width: 320 }}
                          value={effectiveLayerIds}
                          onChange={setSelectedLayerIds}
                          options={layerIds.map((id) => ({
                            value: id,
                            label:
                              datasetContent?.catalogs.layers[id]?.label ?? id,
                          }))}
                        />
                      </Form.Item>
                      <Form.Item label="Measures">
                        <Select
                          mode="multiple"
                          style={{ width: 320 }}
                          value={effectiveMeasureIds}
                          onChange={setSelectedMeasureIds}
                          options={measureIds.map((id) => ({
                            value: id,
                            label:
                              datasetContent?.catalogs.measures[id]?.label ?? id,
                          }))}
                        />
                      </Form.Item>
                    </Space>
                  </Form>

                  <Divider style={{ margin: "4px 0" }} />
                  <Typography.Text strong>Preview</Typography.Text>
                  <Table
                    size="small"
                    columns={columns}
                    dataSource={previewRows}
                    pagination={{ pageSize: 6 }}
                  />
                </Space>
              ),
            },
            {
              key: "aggregated",
              label: "Aggregated",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Text type="secondary">
                    Create a reduced ROI-group matrix from the current
                    Visualization Settings grouping.
                  </Typography.Text>
                  {groupConfig ? (
                    <Alert
                      type="info"
                      showIcon
                      message={`Using grouping: ${groupConfig.fields.join(" → ")} with ${aggregationOrderMode} order. Active ROIs: ${activeRoiIds.length}/${atlasState.order.length}. This will generate ${groupPreview?.groups.length ?? 0} ROI groups. Values will be computed as the mean of all valid ROI-to-ROI edges between groups.`}
                      description="Aggregation summarizes an existing ROI-to-ROI matrix; it does not recompute PLV from source time series."
                    />
                  ) : (
                    <Alert
                      type="warning"
                      showIcon
                      message="No tag-based grouping is currently active in Visualization Settings."
                      description={
                        <Space direction="vertical" size={8}>
                          <Typography.Text>
                            Select one or more grouping fields in Visualization
                            Settings &gt; Grouping first.
                          </Typography.Text>
                          {onOpenGroupingSettings ? (
                            <Button size="small" onClick={onOpenGroupingSettings}>
                              Open Grouping settings
                            </Button>
                          ) : null}
                        </Space>
                      }
                    />
                  )}
                  {inactiveRoiIds.length > 0 ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={`Inactive ROIs excluded: ${inactiveRoiIds.length}`}
                      description={inactiveRoiIds.slice(0, 12).join(", ")}
                    />
                  ) : null}
                  {staleReducedCount > 0 ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={`${staleReducedCount} aggregated matrix${staleReducedCount === 1 ? " is" : "es are"} outdated: active ROIs changed.`}
                    />
                  ) : null}
                  <Form layout="vertical">
                    <Form.Item label="Base matrix">
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%" }}
                      >
                        <Space wrap>
                          <Button
                            size="small"
                            disabled={
                              !groupConfig ||
                              aggregationBaseMatrices.length === 0
                            }
                            onClick={() =>
                              setBaseMatrixIds(
                                aggregationBaseMatrices.map(
                                  (matrix) => matrix.id,
                                ),
                              )
                            }
                          >
                            Select all
                          </Button>
                          <Button
                            size="small"
                            disabled={!groupConfig || baseMatrixIds.length === 0}
                            onClick={() => setBaseMatrixIds([])}
                          >
                            Clear all
                          </Button>
                          <Typography.Text type="secondary">
                            {baseMatrixIds.length} /{" "}
                            {aggregationBaseMatrices.length} selected
                          </Typography.Text>
                        </Space>
                        <Select
                          mode="multiple"
                          style={{ width: "100%" }}
                          value={baseMatrixIds}
                          disabled={!groupConfig}
                          onChange={setBaseMatrixIds}
                          placeholder="Select one or more ROI × ROI base matrices"
                          options={aggregationBaseMatrices.map((matrix) => ({
                            value: matrix.id,
                            label: matrix.label ?? matrix.id,
                          }))}
                        />
                      </Space>
                    </Form.Item>
                  </Form>
                  {aggregationSummary ? (
                    <Alert
                      type="success"
                      showIcon
                      message={aggregationSummary}
                    />
                  ) : null}
                  {aggregationWarnings.map((warning) => (
                    <Alert
                      key={warning}
                      type="warning"
                      showIcon
                      message={warning}
                    />
                  ))}
                </Space>
              ),
            },
          ]}
        />
      </Space>
    </Modal>
  );
}
