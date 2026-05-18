import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Space, Statistic, Tabs, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  applyAggregatedNetworkEdgeFilter,
  applyNetworkEdgeFilter,
  clearAggregatedNetworkEdgeFilter,
  clearNetworkEdgeFilter,
} from "@/store/slices/networkVisualization";
import {
  buildAggregatedEdgeDomain,
  buildNetworkEdgeDomain,
  cloneMatrixFilterDefinition,
  createEmptyMatrixFilterDefinition,
  createRuntimeEdgeMask,
  normalizeMatrixFilterDefinitionForRanges,
  validateMatrixFilterDefinition,
} from "@/utils/edgeFilter";
import MatrixFilterGroupEditor from "./MatrixFilterGroupEditor";
import { formatMatrixKindLabel, formatNetworkMatrixLabel } from "./edgeFilterLabels";
import type { MatrixFilterDefinition } from "@/types/edgeFilter";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

const INCLUDE_DIAGONAL_IN_EDGE_FILTERS = true;

export type NetworkEdgeFilterMode = "roi" | "aggregated";

type NetworkEdgeFilterModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function NetworkEdgeFilterModal({
  open,
  onClose,
}: NetworkEdgeFilterModalProps) {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const network = useAppSelector((state) => state.networkVisualization);
  const globalRangeMode = useAppSelector((state) => state.visualizationUi.uiRangeMode);
  const [selectedMode, setSelectedMode] =
    useState<NetworkEdgeFilterMode | null>(null);

  const [drafts, setDrafts] = useState<Record<NetworkEdgeFilterMode, MatrixFilterDefinition>>(
    () => ({
      roi: createEmptyMatrixFilterDefinition(INCLUDE_DIAGONAL_IN_EDGE_FILTERS, globalRangeMode),
      aggregated: createEmptyMatrixFilterDefinition(
        INCLUDE_DIAGONAL_IN_EDGE_FILTERS,
        globalRangeMode,
      ),
    }),
  );
  const mode = selectedMode ?? "roi";
  const isAggregated = mode === "aggregated";
  const activeMask = isAggregated
    ? network.activeAggregatedEdgeMask
    : network.activeEdgeMask;
  const draft = drafts[mode];

  const matrices = useMemo(
    () => dataset?.connectivity?.matrices ?? [],
    [dataset?.connectivity?.matrices],
  );
  const matrixIndex = useMemo(
    () => dataset?.connectivity?.matrixIndex ?? {},
    [dataset?.connectivity?.matrixIndex],
  );
  const edgeDomain = useMemo(
    () =>
      isAggregated
        ? buildAggregatedEdgeDomain(dataset)
        : buildNetworkEdgeDomain(
            dataset,
            normalizeMatrixOrder(dataset?.metadata.matrixOrder).map((item) => item.id),
          ),
    [dataset, isAggregated],
  );

  useEffect(() => {
    if (!open) return;
    // Initialize editable drafts whenever the modal is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts({
      roi: network.activeNetworkFilter
        ? {
            ...cloneMatrixFilterDefinition(network.activeNetworkFilter),
            includeDiagonal: INCLUDE_DIAGONAL_IN_EDGE_FILTERS,
            uiRangeMode: globalRangeMode,
          }
        : createEmptyMatrixFilterDefinition(INCLUDE_DIAGONAL_IN_EDGE_FILTERS, globalRangeMode),
      aggregated: network.activeAggregatedNetworkFilter
        ? {
            ...cloneMatrixFilterDefinition(network.activeAggregatedNetworkFilter),
            includeDiagonal: INCLUDE_DIAGONAL_IN_EDGE_FILTERS,
            uiRangeMode: globalRangeMode,
          }
        : createEmptyMatrixFilterDefinition(INCLUDE_DIAGONAL_IN_EDGE_FILTERS, globalRangeMode),
    });
  }, [
    globalRangeMode,
    open,
    network.activeAggregatedNetworkFilter,
    network.activeNetworkFilter,
  ]);

  const setCurrentDraft = (nextDraft: MatrixFilterDefinition) => {
    setDrafts((current) => ({
      ...current,
      [mode]: nextDraft,
    }));
  };

  const matrixGroups = useMemo(() => {
    const groups = new Map<string, { value: string; label: string; searchText: string }[]>();
    matrices
      .filter((matrix) => (isAggregated ? matrix.kind === "reduced" : matrix.kind !== "reduced"))
      .forEach((matrix) => {
        const group = formatMatrixKindLabel(matrix);
        const label = formatNetworkMatrixLabel(matrix, dataset?.connectivity?.catalogs);
        const option = {
          value: matrix.id,
          label,
          searchText: `${label} ${matrix.id} ${matrix.context.bandId ?? ""} ${matrix.context.measureId} ${matrix.stat.id}`,
        };
        groups.set(group, [...(groups.get(group) ?? []), option]);
      });
    return ["Population", "Subject", "Comparison", "Aggregated"]
      .filter((label) => groups.has(label))
      .map((label) => ({ label, options: groups.get(label) ?? [] }));
  }, [dataset?.connectivity?.catalogs, isAggregated, matrices]);

  const normalizedDraft = useMemo(
    () =>
      normalizeMatrixFilterDefinitionForRanges(
        { ...draft, includeDiagonal: INCLUDE_DIAGONAL_IN_EDGE_FILTERS },
        matrixIndex,
        dataset?.connectivity?.catalogs,
        globalRangeMode,
      ),
    [dataset?.connectivity?.catalogs, draft, globalRangeMode, matrixIndex],
  );

  const validation = useMemo(
    () =>
      edgeDomain
        ? validateMatrixFilterDefinition(normalizedDraft, matrixIndex, edgeDomain)
        : {
            valid: false,
            errors: [{ id: "missing-domain", severity: "error" as const, message: "The network edge domain is not available." }],
            warnings: [],
          },
    [edgeDomain, matrixIndex, normalizedDraft],
  );

  const preview = useMemo(() => {
    if (!edgeDomain || !validation.valid) return null;
    return createRuntimeEdgeMask(normalizedDraft, matrixIndex, edgeDomain);
  }, [edgeDomain, matrixIndex, normalizedDraft, validation.valid]);

  const handleApply = () => {
    if (!edgeDomain || !validation.valid) return;
    setSelectedMode(null);
    dispatch(
      (isAggregated ? applyAggregatedNetworkEdgeFilter : applyNetworkEdgeFilter)({
        filter: normalizedDraft,
        mask: createRuntimeEdgeMask(normalizedDraft, matrixIndex, edgeDomain),
      }),
    );
    onClose();
  };

  const closeModal = () => {
    setSelectedMode(null);
    onClose();
  };

  return (
    <Modal
      title="Filter"
      open={open}
      width={1040}
      className="edge-filter-modal"
      onCancel={closeModal}
      footer={[
        <Button key="cancel" onClick={closeModal}>
          Cancel
        </Button>,
        <Button
          key="clear-draft"
          onClick={() =>
            setCurrentDraft(
              createEmptyMatrixFilterDefinition(
                INCLUDE_DIAGONAL_IN_EDGE_FILTERS,
                globalRangeMode,
              ),
            )
          }
        >
          Clear
        </Button>,
        <Button
          key="remove-active"
          disabled={!activeMask}
          onClick={() =>
            dispatch(
              isAggregated
                ? clearAggregatedNetworkEdgeFilter()
                : clearNetworkEdgeFilter(),
            )
          }
        >
          Remove active filter
        </Button>,
        <Button key="apply" type="primary" disabled={!validation.valid} onClick={handleApply}>
          Apply filter
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Tabs
          activeKey={mode}
          onChange={(key) => setSelectedMode(key as NetworkEdgeFilterMode)}
          items={[
            { key: "roi", label: "Original" },
            { key: "aggregated", label: "Aggregated" },
          ]}
        />

        <Typography.Paragraph type="secondary">
          {isAggregated
            ? "Combine conditions on compatible reduced matrix values to select which group-to-group edges remain visible."
            : "Combine conditions on loaded matrix values to select which network edges remain visible."}
        </Typography.Paragraph>

        <div className="edge-filter-modal__context">
          <Statistic title="Edge domain" value={edgeDomain?.label ?? "Unavailable"} />
          <Space wrap>
            <Typography.Text>
              Range mode: {globalRangeMode === "observed" ? "Observed" : "Logical default"}
            </Typography.Text>
          </Space>
        </div>

        <MatrixFilterGroupEditor
          group={draft.root}
          isRoot
          matrices={matrices}
          matrixGroups={matrixGroups}
          catalogs={dataset?.connectivity?.catalogs}
          uiRangeMode={globalRangeMode}
          includeDiagonal={INCLUDE_DIAGONAL_IN_EDGE_FILTERS}
          onChange={(root) =>
            setCurrentDraft({
              ...draft,
              includeDiagonal: INCLUDE_DIAGONAL_IN_EDGE_FILTERS,
              root,
            })
          }
        />

        {validation.errors.length > 0 ? (
          <Alert
            type="error"
            showIcon
            message="Filter validation"
            description={validation.errors.map((issue) => (
              <div key={issue.id}>{issue.message}</div>
            ))}
          />
        ) : null}
        {validation.warnings.length > 0 ? (
          <Alert
            type="warning"
            showIcon
            message="Filter warnings"
            description={validation.warnings.map((issue) => (
              <div key={issue.id}>{issue.message}</div>
            ))}
          />
        ) : null}
        {preview ? (
          <Alert
            type="success"
            showIcon
            message={`${preview.selectedCount} / ${preview.totalCount} edges selected (${
              preview.totalCount > 0
                ? ((preview.selectedCount / preview.totalCount) * 100).toFixed(1)
                : "0.0"
            }%)`}
          />
        ) : null}
      </Space>
    </Modal>
  );
}
