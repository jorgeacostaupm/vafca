import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Modal, Space, Tag, Tabs, Typography } from "antd";
import { DEFAULT_NETWORK_EDGE_FILTER_TAB } from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  applyNetworkFilterFromDefinition,
  clearAggregatedNetworkEdgeFilter,
  clearNetworkEdgeFilter,
  resolveNetworkFilterRuntime,
  type NetworkEdgeFilterMode,
} from "@/store/slices/networkFilters";
import {
  cloneMatrixFilterDefinition,
  createEmptyMatrixFilterDefinition,
} from "@/utils/edgeFilter";
import MatrixFilterGroupEditor from "./MatrixFilterGroupEditor";
import { formatMatrixKindLabel, formatNetworkMatrixLabel } from "./edgeFilterLabels";
import type { MatrixFilterDefinition } from "@/types/edgeFilter";

type NetworkEdgeFilterModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function NetworkEdgeFilterModal({
  open,
  onClose,
}: NetworkEdgeFilterModalProps) {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const networkFilters = useAppSelector((state) => state.networkFilters);
  const globalRangeMode = useAppSelector((state) => state.visualizationUi.uiRangeMode);
  const [selectedMode, setSelectedMode] =
    useState<NetworkEdgeFilterMode | null>(null);

  const [drafts, setDrafts] = useState<Record<NetworkEdgeFilterMode, MatrixFilterDefinition>>(
    () => ({
      roi: createEmptyMatrixFilterDefinition(globalRangeMode),
      aggregated: createEmptyMatrixFilterDefinition(globalRangeMode),
    }),
  );
  const mode = selectedMode ?? DEFAULT_NETWORK_EDGE_FILTER_TAB;
  const isAggregated = mode === "aggregated";
  const activeMask = isAggregated
    ? networkFilters.activeAggregatedEdgeMask
    : networkFilters.activeEdgeMask;
  const draft = drafts[mode];

  const matrices = useMemo(
    () => dataset?.content?.matrices ?? [],
    [dataset?.content?.matrices],
  );

  useEffect(() => {
    if (!open) return;
    // Initialize editable drafts whenever the modal is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts({
      roi: networkFilters.activeNetworkFilter
        ? {
            ...cloneMatrixFilterDefinition(networkFilters.activeNetworkFilter),
            uiRangeMode: globalRangeMode,
          }
        : createEmptyMatrixFilterDefinition(globalRangeMode),
      aggregated: networkFilters.activeAggregatedNetworkFilter
        ? {
            ...cloneMatrixFilterDefinition(networkFilters.activeAggregatedNetworkFilter),
            uiRangeMode: globalRangeMode,
          }
        : createEmptyMatrixFilterDefinition(globalRangeMode),
    });
  }, [
    globalRangeMode,
    open,
    networkFilters.activeAggregatedNetworkFilter,
    networkFilters.activeNetworkFilter,
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
        const label = formatNetworkMatrixLabel(matrix, dataset?.content?.catalogs);
        const option = {
          value: matrix.id,
          label,
          searchText: `${label} ${matrix.id} ${matrix.context.layerId ?? ""} ${matrix.context.measureId} ${matrix.stat.id}`,
        };
        groups.set(group, [...(groups.get(group) ?? []), option]);
      });
    return ["Population", "Subject", "Comparison", "Aggregated"]
      .filter((label) => groups.has(label))
      .map((label) => ({ label, options: groups.get(label) ?? [] }));
  }, [dataset?.content?.catalogs, isAggregated, matrices]);

  const runtime = useMemo(
    () =>
      resolveNetworkFilterRuntime({
        mode,
        definition: draft,
        dataset,
        uiRangeMode: globalRangeMode,
      }),
    [dataset, draft, globalRangeMode, mode],
  );
  const validation = runtime.validation;
  const preview = runtime.mask;

  const handleApply = () => {
    if (!runtime.edgeDomain || !validation.valid) return;
    dispatch(
      applyNetworkFilterFromDefinition({
        mode,
        definition: draft,
      }),
    );
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
              createEmptyMatrixFilterDefinition(globalRangeMode),
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

        <MatrixFilterGroupEditor
          group={draft.root}
          isRoot
          matrices={matrices}
          matrixGroups={matrixGroups}
          catalogs={dataset?.content?.catalogs}
          uiRangeMode={globalRangeMode}
          onChange={(root) =>
            setCurrentDraft({
              ...draft,
              root,
            })
          }
        />

        {preview ? (
          <Space size={8} wrap className="edge-filter-modal__status">
            <Tag color={activeMask ? "success" : "default"}>
              {activeMask ? "Active filter" : "No active filter"}
            </Tag>
            <Typography.Text type="secondary">
              Draft matches {preview.selectedCount} / {preview.totalCount} links
              {preview.totalCount > 0
                ? ` (${((preview.selectedCount / preview.totalCount) * 100).toFixed(1)}%)`
                : ""}
            </Typography.Text>
          </Space>
        ) : null}

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
      </Space>
    </Modal>
  );
}
