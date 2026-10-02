import type { RefObject } from "react";
import { memo, useCallback } from "react";

import CircularNodeLinkPanel from "@/components/circular/CircularNodeLinkPanel";
import MatrixHeatmapPanel from "@/components/matrix/MatrixHeatmapPanel";
import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import type { buildNetworkViewRenderData } from "@/components/network/views/networkViewData";
import { NetworkViewStatusContent } from "@/components/network/views/NetworkViewStatus";
import NodeLinkPanel from "@/components/nodelink/NodeLinkPanel";
import { useAppDispatch } from "@/store/hooks";
import {
  applyNetworkZoom,
} from "@/store/slices/networkVisualization";
import { toggleAnnotationNode } from '@/store/slices/visualizationUi'
import type { NetworkViewValueFilters } from "@/types/networkViews";
import type { ComputedView } from "@/types/networkVisualization";

type NetworkViewRendererProps = {
  view: ComputedView["view"];
  computed: ComputedView;
  renderData: ReturnType<typeof buildNetworkViewRenderData>;
  isMatrixView: boolean;
  svgRef: RefObject<SVGSVGElement | null>;
  valueFilters: NetworkViewValueFilters;
};

function NetworkViewRenderer({
  view,
  computed,
  renderData,
  isMatrixView,
  svgRef,
  valueFilters,
}: NetworkViewRendererProps) {
  const dispatch = useAppDispatch();
  const zoomTargetsByType = useNetworkZoomTargets();

  const handleLabelToggle = useCallback(
    (label: string) => {
      dispatch(toggleAnnotationNode({ id: label, label: computed.labelNames?.[label] ?? label }));
    },
    [computed.labelNames, dispatch],
  );
  const handleMatrixBrushZoom = useCallback(
    (payload: { rowLabels: string[]; colLabels: string[] }) => {
      if (payload.rowLabels.length === 0 || payload.colLabels.length === 0) {
        return;
      }
      dispatch(
        applyNetworkZoom({
          targetViewIds: zoomTargetsByType(view.id),
          selection: {
            rows: payload.rowLabels,
            cols: payload.colLabels,
          },
        }),
      );
    },
    [dispatch, view.id, zoomTargetsByType],
  );
  const handleNodeLinkBrushZoom = useCallback(
    (payload: { labels: string[] }) => {
      if (payload.labels.length === 0) return;
      dispatch(
        applyNetworkZoom({
          targetViewIds: zoomTargetsByType(view.id),
          selection: {
            rows: payload.labels,
            cols: payload.labels,
          },
        }),
      );
    },
    [dispatch, view.id, zoomTargetsByType],
  );

  if (view.status !== "ready") {
    return (
      <NetworkViewStatusContent
        viewId={view.id}
        status={view.status}
        error={view.error}
      />
    );
  }

  if (isMatrixView) {
    if (renderData.type !== "matrix") {
      return (
        <NetworkViewStatusContent
          viewId={view.id}
          status="error"
          error="The view data could not be rendered as a matrix."
        />
      );
    }
    return (
      <MatrixHeatmapPanel
        data={renderData.payload.data}
        rowLabels={renderData.payload.rowLabels}
        colLabels={renderData.payload.colLabels}
        compoundId={view.compoundId}
        networkLabel={view.label}
        symmetric={computed.symmetric}
        svgRef={svgRef}
        legendMin={computed.valueDomain.min}
        legendMax={computed.valueDomain.max}
        valueDomain={computed.valueDomain}
        valueFilters={valueFilters}
        labelNames={computed.labelNames}
        labelTitles={computed.labelTitles}
        labelColors={computed.nodeColors}
        brushEnabled={computed.brushEnabled}
        brushMode={computed.brushMode}
        showAllLabels={Boolean(computed.zoomState.current)}
        selectedZoomLabels={computed.zoomLabelSelection}
        onLabelToggle={handleLabelToggle}
        onBrushZoom={handleMatrixBrushZoom}
      />
    );
  }

  if (renderData.type !== "node-link") {
    return (
      <NetworkViewStatusContent
        viewId={view.id}
        status="error"
        error="The view data could not be rendered as a node-link graph."
      />
    );
  }

  const commonNodeLinkProps = {
    data: renderData.payload.data,
    labels: renderData.payload.labels,
    compoundId: view.compoundId,
    networkLabel: view.label,
    svgRef,
    valueFilters,
    selectedZoomLabels: computed.zoomLabelSelection,
    linkWidthRange: computed.linkWidthRange,
    valueDomain: computed.valueDomain,
    brushEnabled: computed.brushEnabled,
    brushMode: computed.brushMode,
    geometricZoomEnabled: computed.geometricZoomEnabled,
    hideIsolatedNodes: computed.hideIsolatedNodes,
    labelNames: computed.labelNames,
    labelTitles: computed.labelTitles,
    labelAcronyms: computed.labelAcronyms,
    nodeColors: computed.nodeColors,
    onLabelToggle: handleLabelToggle,
    onBrushZoom: handleNodeLinkBrushZoom,
  };

  if (view.type === "circular") {
    return (
      <CircularNodeLinkPanel
        {...commonNodeLinkProps}
        atlasDefinition={computed.orderingAtlasDefinition}
        circularLinkTension={computed.circularLinkTension}
        circularBundlingEnabled={computed.circularBundlingEnabled}
        circularPositiveLinkColor={computed.circularPositiveLinkColor}
        circularNegativeLinkColor={computed.circularNegativeLinkColor}
      />
    );
  }
  return <NodeLinkPanel {...commonNodeLinkProps} />;
}

export default memo(NetworkViewRenderer);
