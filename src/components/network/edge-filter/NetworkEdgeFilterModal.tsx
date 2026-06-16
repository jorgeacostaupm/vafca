import { Alert, Button, Modal, Space, Tabs, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";

import { DEFAULT_NETWORK_EDGE_FILTER_TAB } from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  applyNetworkFilterFromDefinition,
  clearAggregatedNetworkEdgeFilter,
  clearNetworkEdgeFilter,
  type NetworkEdgeFilterMode,
  resolveNetworkFilterRuntime,
} from "@/store/slices/networkFilters";
import type { NetworkFilterDefinition } from "@/types/edgeFilter";
import {
  cloneNetworkFilterDefinition,
  createEmptyNetworkFilterDefinition,
} from "@/utils/edgeFilter";

import { formatNetworkFilterOptionLabel, formatNetworkSourceTypeLabel } from "./edgeFilterLabels";
import NetworkFilterGroupEditor from "./NetworkFilterGroupEditor";

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

  const [drafts, setDrafts] = useState<Record<NetworkEdgeFilterMode, NetworkFilterDefinition>>(
    () => ({
      original: createEmptyNetworkFilterDefinition(globalRangeMode),
      aggregated: createEmptyNetworkFilterDefinition(globalRangeMode),
    }),
  );
  const mode = selectedMode ?? DEFAULT_NETWORK_EDGE_FILTER_TAB;
  const isAggregated = mode === "aggregated";
  const activeMask = isAggregated
    ? networkFilters.activeAggregatedEdgeMask
    : networkFilters.activeEdgeMask;
  const draft = drafts[mode];

  const networks = useMemo(
    () => dataset?.content?.networks ?? [],
    [dataset?.content?.networks],
  );

  useEffect(() => {
    if (!open) return;
    // Initialize editable drafts whenever the modal is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts({
      original: networkFilters.activeNetworkFilter
        ? {
            ...cloneNetworkFilterDefinition(networkFilters.activeNetworkFilter),
            uiRangeMode: globalRangeMode,
          }
        : createEmptyNetworkFilterDefinition(globalRangeMode),
      aggregated: networkFilters.activeAggregatedNetworkFilter
        ? {
            ...cloneNetworkFilterDefinition(networkFilters.activeAggregatedNetworkFilter),
            uiRangeMode: globalRangeMode,
          }
        : createEmptyNetworkFilterDefinition(globalRangeMode),
    });
  }, [
    globalRangeMode,
    open,
    networkFilters.activeAggregatedNetworkFilter,
    networkFilters.activeNetworkFilter,
  ]);

  const setCurrentDraft = (nextDraft: NetworkFilterDefinition) => {
    setDrafts((current) => ({
      ...current,
      [mode]: nextDraft,
    }));
  };

  const networkGroups = useMemo(() => {
    const groups = new Map<string, { value: string; label: string; searchText: string }[]>();
    networks
      .filter((network) =>
        isAggregated
          ? network.derivation?.type === "aggregation"
          : network.derivation?.type !== "aggregation",
      )
      .forEach((network) => {
        const group = formatNetworkSourceTypeLabel(network);
        const label = formatNetworkFilterOptionLabel(network, dataset?.content?.catalogs);
        const option = {
          value: network.id,
          label,
          searchText: `${label} ${network.id} ${network.context.layerId ?? ""} ${network.measureId} ${network.statisticId}`,
        };
        groups.set(group, [...(groups.get(group) ?? []), option]);
      });
    return ["Population", "Subject", "Comparison", "Aggregated"]
      .filter((label) => groups.has(label))
      .map((label) => ({ label, options: groups.get(label) ?? [] }));
  }, [dataset?.content?.catalogs, isAggregated, networks]);

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
              createEmptyNetworkFilterDefinition(globalRangeMode),
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
            { key: "original", label: "Original" },
            { key: "aggregated", label: "Aggregated" },
          ]}
        />

        <NetworkFilterGroupEditor
          group={draft.root}
          isRoot
          networks={networks}
          networkGroups={networkGroups}
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
