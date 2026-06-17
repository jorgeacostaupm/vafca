import {
  AppstoreOutlined,
  Loading3QuartersOutlined,
} from "@ant-design/icons";
import { Card, Segmented, Typography } from "antd";
import type React from "react";
import { memo, useMemo, useState } from "react";

import CircularNodeLinkPanel from "@/components/circular/CircularNodeLinkPanel";
import MatrixHeatmapPanel from "@/components/matrix/MatrixHeatmapPanel";
import {
  assertSelectedLinksFallbackGraph,
  buildSelectedLinksFallbackGraph,
  type SelectedLinksFallbackNodeMode,
} from "@/components/selected-links/selectedLinksFallbackGraph";
import type { ResolvedValueDomain } from "@/types/valueDomain";
import type { SelectedLink } from "@/types/visualizationUi";

type SelectedLinksFallbackViewType = "matrix" | "circular";

type SelectedLinksFallbackViewProps = {
  links: SelectedLink[];
  atlasOrder: string[];
  labelById: Record<string, string>;
};

const viewOptions = [
  { value: "matrix", label: <AppstoreOutlined aria-label="Matrix" /> },
  { value: "circular", label: <Loading3QuartersOutlined aria-label="Circular" /> },
] satisfies Array<{ value: SelectedLinksFallbackViewType; label: React.ReactNode }>;

const nodeModeOptions = [
  { value: "connected", label: "Linked nodes" },
  { value: "all", label: "All nodes" },
] satisfies Array<{ value: SelectedLinksFallbackNodeMode; label: string }>;

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
}: SelectedLinksFallbackViewProps) {
  const [viewType, setViewType] = useState<SelectedLinksFallbackViewType>("matrix");
  const [nodeMode, setNodeMode] = useState<SelectedLinksFallbackNodeMode>("connected");
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
        onViewTypeChange={setViewType}
        onNodeModeChange={setNodeMode}
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
      onViewTypeChange={setViewType}
      onNodeModeChange={setNodeMode}
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
    <Card
      className="panel-card selected-links-view-card"
      size="small"
      title={
        <div className="panel-card-title">
          <span className="selected-links-view-card__title">Selected links</span>
          <Typography.Text type="secondary" className="selected-links-view-card__summary">
            {summary}
          </Typography.Text>
        </div>
      }
      extra={
        <div className="panel-card-extra-actions selected-links-view-card__actions">
          <Segmented
            size="small"
            value={viewType}
            options={viewOptions}
            onChange={(value) => onViewTypeChange(value)}
          />
          <Segmented
            size="small"
            value={nodeMode}
            options={nodeModeOptions}
            onChange={(value) => onNodeModeChange(value)}
          />
        </div>
      }
    >
      <div className="selected-links-view">{children}</div>
    </Card>
  );
}
