import MatrixHeatmapPanel from "@/components/matrix/MatrixPanel";
import type { RefObject } from "react";
import Circulas from "@/components/circular/Circulas";
import NodeLinkPanel from "@/components/nodelink/NodeLinkPanel";
import {
  applyNetworkZoom,
  toggleNetworkZoomLabelSelection,
} from "@/store/slices/networkVisualization";
import { useAppDispatch } from "@/store/hooks";
import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import { NetworkViewStatusContent } from "@/components/network/views/NetworkViewStatus";
import type { ComputedView } from "@/types/networkVisualization";
import type { ResolvedUiRange } from "@/utils/matrixUiRange";
import type { buildAdaptedNetworkViewData } from "@/components/network/views/networkViewData";

type NetworkViewRendererProps = {
  view: ComputedView["view"];
  computed: ComputedView;
  adapted: ReturnType<typeof buildAdaptedNetworkViewData>;
  isMatrixView: boolean;
  matrixLegendRange?: ResolvedUiRange;
  svgRef: RefObject<SVGSVGElement | null>;
  valueFilters: {
    measure: null;
    stat: ComputedView["statFilter"];
  };
};

export default function NetworkViewRenderer({
  view,
  computed,
  adapted,
  isMatrixView,
  matrixLegendRange,
  svgRef,
  valueFilters,
}: NetworkViewRendererProps) {
  const dispatch = useAppDispatch();
  const zoomTargetsByType = useNetworkZoomTargets();

  const handleLabelToggle = (label: string) => {
    dispatch(
      toggleNetworkZoomLabelSelection({
        viewId: view.id,
        label,
        orderedLabels: computed.availableLabels,
      }),
    );
  };

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
        svgRef={svgRef}
        legendMin={matrixLegendRange?.min}
        legendMax={matrixLegendRange?.max}
        invertColorScale={view.statId === "p_value" || view.statId === "t_value"}
        valueFilters={valueFilters}
        brushEnabled={computed.brushEnabled}
        showAllLabels={Boolean(computed.zoomState.current)}
        selectedZoomLabels={computed.zoomLabelSelection}
        onLabelToggle={handleLabelToggle}
        onBrushZoom={(payload) => {
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
        }}
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
    linkWidthRange: computed.linkWidthRange,
    brushEnabled: computed.brushEnabled,
    geometricZoomEnabled: computed.geometricZoomEnabled,
    hideIsolatedNodes: computed.hideIsolatedNodes,
    diverging: computed.hasNegativeRange,
    onLabelToggle: handleLabelToggle,
    onBrushZoom: (payload: { labels: string[] }) => {
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
  };

  if (view.type === "circular") {
    return (
      <Circulas
        {...commonNodeLinkProps}
        circularLinkTension={computed.circularLinkTension}
        circularBundlingEnabled={computed.circularBundlingEnabled}
      />
    );
  }
  return <NodeLinkPanel {...commonNodeLinkProps} />;
}
