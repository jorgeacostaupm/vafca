import {
  useCallback,
  useMemo,
} from "react";
import NodeLinkViewTemplate from "@/components/nodelink/NodeLinkViewTemplate";
import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import type { CircularNode as Node } from "@/types/nodelink";
import { buildCircularGraphData } from "@/components/circular/circularGraphModel";
import { useCircularProgrammaticTooltip } from "@/components/circular/useCircularProgrammaticTooltip";
import { useCircularSelectionStyles } from "@/components/circular/useCircularSelectionStyles";
import { useCircularScene } from "@/components/circular/useCircularScene";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";
import type {
  CircularNodeLinkPanelProps,
  CircularNodeLinkProps,
} from "@/components/circular/circularPanelTypes";

const SELECTED_COLOR = "#d64545";

export default function Circulas({
  diverging,
  atlasDefinition,
  circularHierarchyFields,
  circularHierarchyCategoryOrder,
  ...props
}: CircularNodeLinkPanelProps) {
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const currentAtlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));

  return (
    <NodeLinkViewTemplate
      Renderer={CircularNodeLink}
      rendererProps={{
        atlasDefinition: atlasDefinition ?? currentAtlasDefinition,
        circularHierarchyFields:
          circularHierarchyFields ?? atlas.colorFields,
        circularHierarchyCategoryOrder:
          circularHierarchyCategoryOrder ?? atlas.circularHierarchyCategoryOrder,
      }}
      diverging={diverging ?? false}
      {...props}
    />
  );
}

function CircularNodeLink({
  data,
  matrixLabel,
  labels,
  labelNames,
  labelTitles,
  nodeColors,
  width,
  height,
  svgRef: svgRefProp,
  valueFilters,
  selectedZoomLabels,
  linkWidthRange,
  circularLinkTension,
  circularBundlingEnabled,
  brushEnabled = false,
  geometricZoomEnabled = false,
  hideIsolatedNodes = true,
  diverging,
  atlasDefinition = null,
  circularHierarchyFields = [],
  circularHierarchyCategoryOrder = {},
  selectedLinkIds,
  hoveredCell,
  hoveredNodeId,
  onLabelToggle,
  onLinkSelect,
  onLinkHover,
  onLinkLeave,
  onNodeHover,
  onNodeLeave,
  onBrushZoom,
}: CircularNodeLinkProps) {
  const { nodes, links, degreeById } = useMemo(
    () =>
      buildCircularGraphData({
        data,
        labels,
        labelNames,
        valueFilters,
        hideIsolatedNodes,
        width,
        height,
        atlasDefinition,
        hierarchyFields: circularHierarchyFields,
        hierarchyCategoryOrder: circularHierarchyCategoryOrder,
      }),
    [
      data,
      labels,
      labelNames,
      valueFilters,
      hideIsolatedNodes,
      width,
      height,
      atlasDefinition,
      circularHierarchyFields,
      circularHierarchyCategoryOrder,
    ],
  );

  const getNodeColor = useCallback(
    (node: Node) => {
      const labelId = node.labelId ?? String(node.id);
      return nodeColors?.[labelId] ?? "#1b2b38";
    },
    [nodeColors],
  );
  const valueLabel = useMemo(
    () => buildTooltipValueLabel(matrixLabel),
    [matrixLabel],
  );

  const {
    wrapperRef,
    svgRef,
    tooltipRef,
    zoomTransformRef,
    localHoverActive,
    linkSelectionRef,
    nodeSelectionRef,
    labelSelectionRef,
    widthScaleRef,
    nodeRadiusRef,
    zoomLabelSetRef,
  } = useCircularScene({
    svgRefProp,
    width,
    height,
    labels,
    labelNames,
    labelTitles,
    nodes,
    links,
    degreeById,
    selectedZoomLabels,
    linkWidthRange,
    circularLinkTension,
    circularBundlingEnabled,
    brushEnabled,
    geometricZoomEnabled,
    diverging,
    selectedLinkIds,
    onLabelToggle,
    onLinkSelect,
    onLinkHover,
    onLinkLeave,
    onNodeHover,
    onNodeLeave,
    onBrushZoom,
    getNodeColor,
    valueLabel,
  });

  useCircularSelectionStyles({
    linkSelectionRef,
    nodeSelectionRef,
    labelSelectionRef,
    widthScaleRef,
    zoomLabelSetRef,
    nodeRadiusRef,
    hoveredCell,
    hoveredNodeId,
    selectedLinkIds,
    getNodeColor,
    selectedColor: SELECTED_COLOR,
  });

  useCircularProgrammaticTooltip({
    tooltipRef,
    wrapperRef,
    localHoverActive,
    width,
    height,
    nodes,
    links,
    degreeById,
    hoveredCell,
    hoveredNodeId,
    labelNames,
    labelTitles,
    valueLabel,
    zoomTransformRef,
  });

  return (
    <div
      ref={wrapperRef}
      className="node-link-wrapper"
      style={{ width, height }}
    >
      <svg ref={svgRef} width={width} height={height} />
      <div ref={tooltipRef} className="node-link-tooltip" />
    </div>
  );
}
