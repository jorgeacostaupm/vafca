import { AppstoreOutlined, Loading3QuartersOutlined, UpOutlined } from "@ant-design/icons";
import { Select, Typography } from "antd";
import type React from "react";
import { memo, useMemo } from "react";

import CircularNodeLinkPanel from "@/components/circular/CircularNodeLinkPanel";
import MatrixHeatmapPanel from "@/components/matrix/MatrixHeatmapPanel";
import {
  assertSelectedLinksFallbackGraph,
  buildSelectedLinksFallbackGraph,
  type SelectedLinksFallbackNodeMode,
} from "@/components/selected-links/selectedLinksFallbackGraph";
import SelectedLinksViewFrame from "@/components/selected-links/SelectedLinksViewFrame";
import { SELECTED_LINKS_2D_VIEW_OPTIONS, SELECTED_LINKS_NODE_MODE_OPTIONS } from "@/config/ui";
import type { ResolvedValueDomain } from "@/types/valueDomain";
import type { SelectedLink } from "@/types/visualizationUi";

export type SelectedLinksFallbackViewType = "matrix" | "circular";

type SelectedLinksFallbackViewProps = {
  links: SelectedLink[];
  atlasOrder: string[];
  labelById: Record<string, string>;
  viewType: SelectedLinksFallbackViewType;
  nodeMode: SelectedLinksFallbackNodeMode;
  onViewTypeChange: (value: SelectedLinksFallbackViewType) => void;
  onNodeModeChange: (value: SelectedLinksFallbackNodeMode) => void;
};

const adjacencyValueDomain: ResolvedValueDomain = {
  min: 0,
  max: 1,
  center: null,
  scaleType: "sequential",
  mode: "view_observed",
  source: "fallback",
  symmetric: false,
};

if (import.meta.env.DEV) {
  assertSelectedLinksFallbackGraph();
}

function SelectedLinksFallbackView({
  links,
  atlasOrder,
  labelById,
  viewType,
  nodeMode,
  onViewTypeChange,
  onNodeModeChange,
}: SelectedLinksFallbackViewProps) {
  const graph = useMemo(
    () =>
      buildSelectedLinksFallbackGraph({
        links,
        atlasOrder,
        labelById,
        nodeMode,
      }),
    [atlasOrder, labelById, links, nodeMode],
  );

  if (links.length === 0) {
    return (
      <SelectedLinksFallbackFrame
        viewType={viewType}
        nodeMode={nodeMode}
        onViewTypeChange={onViewTypeChange}
        onNodeModeChange={onNodeModeChange}
        summary="0 links"
      >
        <div className="selected-links-view__empty">
          <Typography.Text type="secondary">
            Select links to show them in this view.
          </Typography.Text>
        </div>
      </SelectedLinksFallbackFrame>
    );
  }

  return (
    <SelectedLinksFallbackFrame
      viewType={viewType}
      nodeMode={nodeMode}
      onViewTypeChange={onViewTypeChange}
      onNodeModeChange={onNodeModeChange}
      summary={`${graph.edgeCount} link${graph.edgeCount === 1 ? "" : "s"} · ${graph.labels.length} node${graph.labels.length === 1 ? "" : "s"}`}
    >
      {viewType === "matrix" ? (
        <div className="selected-links-view__renderer">
          <MatrixHeatmapPanel
            data={graph.data}
            labels={graph.labels}
            compoundId="selected-links-adjacency"
            networkLabel="Selected links"
            symmetric
            legendMin={0}
            legendMax={1}
            valueDomain={adjacencyValueDomain}
            valueFilters={{ measure: [1, 1] }}
            selectionVisible={false}
            showAllLabels={nodeMode === "all"}
          />
        </div>
      ) : (
        <div className="selected-links-view__renderer">
          <CircularNodeLinkPanel
            data={graph.data}
            labels={graph.labels}
            compoundId="selected-links-adjacency"
            networkLabel="Selected links"
            valueDomain={adjacencyValueDomain}
            valueFilters={{ measure: [1, 1] }}
            hideIsolatedNodes={false}
            selectionVisible={false}
            circularPositiveLinkColor="var(--color-network-link)"
            circularNegativeLinkColor="var(--color-network-link)"
          />
        </div>
      )}
    </SelectedLinksFallbackFrame>
  );
}

export default memo(SelectedLinksFallbackView);

function SelectedLinksFallbackFrame({
  viewType,
  nodeMode,
  onViewTypeChange,
  onNodeModeChange,
  summary,
  children,
}: {
  viewType: SelectedLinksFallbackViewType;
  nodeMode: SelectedLinksFallbackNodeMode;
  onViewTypeChange: (value: SelectedLinksFallbackViewType) => void;
  onNodeModeChange: (value: SelectedLinksFallbackNodeMode) => void;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <SelectedLinksViewFrame
      summary={summary}
      actions={
        <>
          <Select<SelectedLinksFallbackViewType>
            aria-label="2D view type"
            size="small"
            placement="topLeft"
            suffixIcon={<UpOutlined />}
            popupMatchSelectWidth={false}
            value={viewType}
            options={SELECTED_LINKS_2D_VIEW_OPTIONS.map(({ value, label }) => ({
              value,
              label: (
                <span aria-label={label} title={label}>
                  {value === "matrix" ? <AppstoreOutlined /> : <Loading3QuartersOutlined />}
                </span>
              ),
            }))}
            onChange={onViewTypeChange}
          />
          <Select<SelectedLinksFallbackNodeMode>
            aria-label="Nodes to display"
            size="small"
            placement="topLeft"
            suffixIcon={<UpOutlined />}
            popupMatchSelectWidth={false}
            value={nodeMode}
            options={SELECTED_LINKS_NODE_MODE_OPTIONS}
            onChange={onNodeModeChange}
          />
        </>
      }
    >
      {children}
    </SelectedLinksViewFrame>
  );
}
