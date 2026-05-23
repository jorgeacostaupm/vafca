import {
  intersectAllowedSets,
  resolveAllowedSet,
} from "@/components/network/networkFormatting";
import type { BuildPanelItem } from "@/types/networkPanels";
import { NetworkPanelStatusContent } from "@/components/network/panels/NetworkPanelCommon";
import NetworkPanelActions from "@/components/network/panels/NetworkPanelActions";
import NetworkPanelContent from "@/components/network/panels/NetworkPanelContent";
import NetworkPanelViewTypeSelector from "@/components/network/panels/NetworkPanelViewTypeSelector";
import {
  buildAdaptedNetworkPanelData,
  buildPanelValueFilters,
} from "@/components/network/panels/networkPanelData";
import { resolveNetworkPanelViewTitle } from "@/components/network/panels/networkPanelViewTitle";

export const buildNetworkPanelItem: BuildPanelItem = ({
  computed,
  svgRef,
  matrixRecord,
  dataset,
  visibilityByViewId,
  nodeFilterContributors,
  linkFilterContributors,
  runtimeAllowedLinkIds,
  runtimeAggregatedAllowedLinkIds,
  matrixLegendRange,
}) => {
  const view = computed.view;
  const isMatrixView = view.type === "matrix";
  const valueFilters = buildPanelValueFilters(computed);
  const viewTitle = resolveNetworkPanelViewTitle(view.type);
  const sourceMatrix = dataset?.connectivity?.matrixIndex[matrixRecord.id];
  const isReducedMatrix = sourceMatrix?.kind === "reduced";
  const skipCrossViewFiltering =
    isReducedMatrix || computed.useAsNodeFilter || computed.useAsLinkFilter;

  const allowedNodeIds = skipCrossViewFiltering
    ? null
    : resolveAllowedSet(
        nodeFilterContributors,
        view.id,
        "nodeIds",
        visibilityByViewId,
      );
  const crossViewAllowedLinkIds = skipCrossViewFiltering
    ? null
    : resolveAllowedSet(
        linkFilterContributors,
        view.id,
        "linkIds",
        visibilityByViewId,
      );
  const allowedLinkIds = intersectAllowedSets(
    crossViewAllowedLinkIds,
    isReducedMatrix ? runtimeAggregatedAllowedLinkIds : runtimeAllowedLinkIds,
  );

  const adapted = buildAdaptedNetworkPanelData({
    viewType: view.type,
    computed,
    valueFilters,
    allowedNodeIds,
    allowedLinkIds,
  });

  const statusContent = (
    <NetworkPanelStatusContent
      viewId={view.id}
      status={view.status}
      error={view.error}
    />
  );

  return {
    id: view.id,
    title: view.label,
    headerStart: <NetworkPanelViewTypeSelector view={view} />,
    className: computed.isRangeFilterSource
      ? "network-panel-card--range-filter-source"
      : undefined,
    actions: (
      <NetworkPanelActions
        view={view}
        computed={computed}
        isMatrixView={isMatrixView}
        viewTitle={viewTitle}
        svgRef={svgRef}
      />
    ),
    content: (
      <NetworkPanelContent
        view={view}
        computed={computed}
        adapted={adapted}
        isMatrixView={isMatrixView}
        statusContent={statusContent}
        matrixLegendRange={matrixLegendRange}
        svgRef={svgRef}
        valueFilters={valueFilters}
      />
    ),
  };
};
