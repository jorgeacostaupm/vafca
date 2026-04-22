import { resolveAllowedSet } from "@/components/network/networkFormatting";
import { getLegendRange } from "@/utils/matrixViewUtils";
import {
  patchNetworkMatrixSettings,
  patchNetworkNodeLinkSettings,
} from "@/store/slices/networkVisualizationSlice";
import type { BuildPanelItem } from "@/types/networkPanels";
import type { SharedNetworkViewSettings } from "@/types/networkVisualization";
import { StatusContent } from "@/components/network/panels/NetworkPanelCommon";
import NetworkPanelActions from "@/components/network/panels/NetworkPanelActions";
import NetworkPanelContent from "@/components/network/panels/NetworkPanelContent";
import {
  buildAdaptedNetworkPanelData,
  buildPanelValueFilters,
} from "@/components/network/panels/networkPanelData";
import { resolveNetworkPanelViewTitle } from "@/components/network/panels/networkPanelViewTitle";

type SharedPanelSettingsPatch = Partial<
  SharedNetworkViewSettings & { brushEnabled: boolean }
>;

export const buildNetworkPanelItem: BuildPanelItem = ({
  computed,
  svgRef,
  matrixRecord,
  dataset,
  matrixShape,
  labelNames,
  labelTitles,
  labelAcronyms,
  nodeColors,
  visibilityByViewId,
  nodeFilterContributors,
  linkFilterContributors,
  zoomTargetsByType,
  dispatch,
  markFormatting,
}) => {
  const view = computed.view;
  const isMatrixView = view.type === "matrix";
  const valueFilters = buildPanelValueFilters(computed);
  const viewTitle = resolveNetworkPanelViewTitle(view.type);

  const allowedNodeIds = resolveAllowedSet(
    nodeFilterContributors,
    view.id,
    "nodeIds",
    visibilityByViewId,
  );
  const allowedLinkIds = resolveAllowedSet(
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

  const patchSharedSettings = (patch: SharedPanelSettingsPatch) => {
    if (isMatrixView) {
      dispatch(
        patchNetworkMatrixSettings({
          viewId: view.id,
          patch,
        }),
      );
      return;
    }
    dispatch(
      patchNetworkNodeLinkSettings({
        viewId: view.id,
        patch,
      }),
    );
  };

  const statusContent = (
    <StatusContent
      status={view.status}
      error={view.error}
      onRetry={() => dispatch(markFormatting({ viewId: view.id }))}
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
        zoomTargetsByType={zoomTargetsByType}
        dispatch={dispatch}
        patchSharedSettings={patchSharedSettings}
      />
    ),
    content: (
      <NetworkPanelContent
        view={view}
        computed={computed}
        adapted={adapted}
        isMatrixView={isMatrixView}
        statusContent={statusContent}
        matrixShape={matrixShape}
        matrixLegendRange={matrixLegendRange}
        labelNames={labelNames}
        labelTitles={labelTitles}
        labelAcronyms={labelAcronyms}
        nodeColors={nodeColors}
        svgRef={svgRef}
        valueFilters={valueFilters}
        dispatch={dispatch}
        zoomTargetsByType={zoomTargetsByType}
      />
    ),
  };
};
