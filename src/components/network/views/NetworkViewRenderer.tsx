import type { RefObject } from "react";
import { memo, useCallback } from "react";

import Circulas from "@/components/circular/Circulas";
import MatrixHeatmapPanel from "@/components/matrix/MatrixPanel";
import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import type { buildAdaptedNetworkViewData } from "@/components/network/views/networkViewData";
import { NetworkViewStatusContent } from "@/components/network/views/NetworkViewStatus";
import NodeLinkPanel from "@/components/nodelink/NodeLinkPanel";
import { useAppDispatch } from "@/store/hooks";
import {
  applyNetworkZoom,
  toggleNetworkZoomLabelSelection,
} from "@/store/slices/networkVisualization";
import type { ComputedView } from "@/types/networkVisualization";

type NetworkViewRendererProps = {
  view: ComputedView["view"];
  computed: ComputedView;
  adapted: ReturnType<typeof buildAdaptedNetworkViewData>;
  isMatrixView: boolean;
  svgRef: RefObject<SVGSVGElement | null>;
  valueFilters: {
    measure: null;
    stat: ComputedView["statFilter"];
  };
};

function NetworkViewRenderer({
  view,
  computed,
  adapted,
  isMatrixView,
  svgRef,
  valueFilters,
}: NetworkViewRendererProps) {
  const dispatch = useAppDispatch();
  const zoomTargetsByType = useNetworkZoomTargets();

  const handleLabelToggle = useCallback(
    (label: string) => {
      dispatch(
        toggleNetworkZoomLabelSelection({
          viewId: view.id,
          label,
          orderedLabels: computed.availableLabels,
        }),
      );
    },
    [computed.availableLabels, dispatch, view.id],
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
    if (adapted.type !== "matrix") {
      return (
        <NetworkViewStatusContent
          viewId={view.id}
          status="error"
          error="The view data could not be adapted as a matrix."
        />
      );
    }
    return (
      <MatrixHeatmapPanel
        data={adapted.payload.data}
        rowLabels={adapted.payload.rowLabels}
        colLabels={adapted.payload.colLabels}
        compoundId={view.compoundId}
        matrixLabel={view.label}
        symmetric={computed.symmetric}
        svgRef={svgRef}
        legendMin={computed.valueDomain.min}
        legendMax={computed.valueDomain.max}
        valueDomain={computed.valueDomain}
        valueFilters={valueFilters}
        brushEnabled={computed.brushEnabled}
        brushMode={computed.brushMode}
        showAllLabels={Boolean(computed.zoomState.current)}
        selectedZoomLabels={computed.zoomLabelSelection}
        selectionVisible={computed.selectionVisible}
        onLabelToggle={handleLabelToggle}
        onBrushZoom={handleMatrixBrushZoom}
      />
    );
  }

  if (adapted.type !== "node-link") {
    return (
      <NetworkViewStatusContent
        viewId={view.id}
        status="error"
        error="The view data could not be adapted as a node-link graph."
      />
    );
  }

  const commonNodeLinkProps = {
    data: adapted.payload.data,
    labels: adapted.payload.labels,
    compoundId: view.compoundId,
    matrixLabel: view.label,
    svgRef,
    valueFilters,
    selectedZoomLabels: computed.zoomLabelSelection,
    selectionVisible: computed.selectionVisible,
    linkWidthRange: computed.linkWidthRange,
    valueDomain: computed.valueDomain,
    brushEnabled: computed.brushEnabled,
    brushMode: computed.brushMode,
    geometricZoomEnabled: computed.geometricZoomEnabled,
    hideIsolatedNodes: computed.hideIsolatedNodes,
    onLabelToggle: handleLabelToggle,
    onBrushZoom: handleNodeLinkBrushZoom,
  };

  if (view.type === "circular") {
    return (
      <Circulas
        {...commonNodeLinkProps}
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
