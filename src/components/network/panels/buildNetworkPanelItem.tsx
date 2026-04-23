import { resolveAllowedSet } from "@/components/network/networkFormatting";
import { getLegendRange } from "@/utils/matrixViewUtils";
import type { BuildPanelItem } from "@/types/networkPanels";
import { NetworkPanelStatusContent } from "@/components/network/panels/NetworkPanelCommon";
import NetworkPanelActions from "@/components/network/panels/NetworkPanelActions";
import NetworkPanelContent from "@/components/network/panels/NetworkPanelContent";
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
}) => {
  const view = computed.view;
  const isMatrixView = view.type === "matrix";
  const valueFilters = buildPanelValueFilters(computed);
  const viewTitle = resolveNetworkPanelViewTitle(view.type);
  const skipCrossViewFiltering =
    computed.useAsNodeFilter || computed.useAsLinkFilter;

  const allowedNodeIds = skipCrossViewFiltering
    ? null
    : resolveAllowedSet(
        nodeFilterContributors,
        view.id,
        "nodeIds",
        visibilityByViewId,
      );
  const allowedLinkIds = skipCrossViewFiltering
    ? null
    : resolveAllowedSet(
        linkFilterContributors,
        view.id,
        "linkIds",
        visibilityByViewId,
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

  const matrixLegendRange = isMatrixView
    ? getLegendRange(
        matrixRecord.data,
        view.measureId,
        view.statId,
        dataset?.catalogs,
      )
    : undefined;

  return {
    id: view.id,
    title: `${viewTitle} · ${view.label}`,
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
