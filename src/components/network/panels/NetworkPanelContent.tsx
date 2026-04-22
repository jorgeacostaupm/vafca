import MatrixHeatmapPanel from "@/components/matrix/MatrixPanel";
import Circulas from "@/components/circular/Circulas";
import NodeLinkPanel from "@/components/nodelink/NodeLinkPanel";
import {
  applyNetworkZoom,
  toggleNetworkZoomLabelSelection,
} from "@/store/slices/networkVisualization";
import type { ReactNode } from "react";
import type { ComputedView } from "@/types/networkVisualization";
import type { NetworkPanelCommonProps } from "@/types/networkPanels";
import type { buildAdaptedNetworkPanelData } from "@/components/network/panels/networkPanelData";

type NetworkPanelContentProps = {
  view: ComputedView["view"];
  computed: ComputedView;
  adapted: ReturnType<typeof buildAdaptedNetworkPanelData>;
  isMatrixView: boolean;
  statusContent: ReactNode;
  matrixShape: NetworkPanelCommonProps["matrixShape"];
  matrixLegendRange?: { min: number | undefined; max: number | undefined };
  labelNames: NetworkPanelCommonProps["labelNames"];
  labelTitles: NetworkPanelCommonProps["labelTitles"];
  labelAcronyms: NetworkPanelCommonProps["labelAcronyms"];
  nodeColors: NetworkPanelCommonProps["nodeColors"];
  svgRef: NetworkPanelCommonProps["svgRef"];
  valueFilters: {
    measure: null;
    stat: ComputedView["statFilter"];
  };
  dispatch: NetworkPanelCommonProps["dispatch"];
  zoomTargetsByType: NetworkPanelCommonProps["zoomTargetsByType"];
};

export default function NetworkPanelContent({
  view,
  computed,
  adapted,
  isMatrixView,
  statusContent,
  matrixShape,
  matrixLegendRange,
  labelNames,
  labelTitles,
  labelAcronyms,
  nodeColors,
  svgRef,
  valueFilters,
  dispatch,
  zoomTargetsByType,
}: NetworkPanelContentProps) {
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
    return statusContent;
  }

  if (isMatrixView) {
    if (adapted.type !== "matrix") return statusContent;
    return (
      <MatrixHeatmapPanel
        data={adapted.payload.data}
        rowLabels={adapted.payload.rowLabels}
        colLabels={adapted.payload.colLabels}
        compoundId={view.compoundId}
        matrixLabel={view.label}
        labelNames={labelNames}
        svgRef={svgRef}
        matrixShape={matrixShape}
        legendMin={matrixLegendRange?.min}
        legendMax={matrixLegendRange?.max}
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
    return statusContent;
  }

  const commonNodeLinkProps = {
    data: adapted.payload.data,
    labels: adapted.payload.labels,
    labelNames,
    labelTitles,
    labelAcronyms,
    nodeColors,
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
    return <Circulas {...commonNodeLinkProps} />;
  }
  return <NodeLinkPanel {...commonNodeLinkProps} />;
}
