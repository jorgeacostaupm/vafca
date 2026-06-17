import {
  useCallback,
  useMemo,
} from "react";

import { buildCircularGraphData } from "@/components/circular/circularGraphModel";
import type {
  CircularNodeLinkPanelProps,
  CircularNodeLinkProps,
} from "@/components/circular/circularPanelTypes";
import { useCircularProgrammaticTooltip } from "@/components/circular/useCircularProgrammaticTooltip";
import { useCircularScene } from "@/components/circular/useCircularScene";
import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import NodeLinkViewTemplate from "@/components/nodelink/NodeLinkViewTemplate";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import type { CircularNode as Node } from "@/types/nodelink";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

export default function CircularNodeLinkPanel({
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
      {...props}
    />
  );
}

function CircularNodeLink({
  data,
  networkLabel,
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
  valueDomain,
  circularLinkTension,
  circularBundlingEnabled,
  brushEnabled = false,
  brushMode = "zoom",
  geometricZoomEnabled = false,
  hideIsolatedNodes = true,
  atlasDefinition = null,
  circularHierarchyFields = [],
  circularHierarchyCategoryOrder = {},
  selectedLinkIds,
  visualStyle,
  linkColorResolver,
  onLabelToggle,
  onLinkSelect,
  onLinkHover,
  onLinkLeave,
  onNodeHover,
  onNodeLeave,
  onBrushZoom,
  onBrushSelectLinks,
  onBrushDeselectLinks,
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
    () => buildTooltipValueLabel(networkLabel),
    [networkLabel],
  );

  const {
    wrapperRef,
    svgRef,
    tooltipRef,
    zoomTransformRef,
    localHoverActive,
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
    valueDomain,
    circularLinkTension,
    circularBundlingEnabled,
    brushEnabled,
    brushMode,
    geometricZoomEnabled,
    selectedLinkIds,
    visualStyle,
    linkColorResolver,
    onLabelToggle,
    onLinkSelect,
    onLinkHover,
    onLinkLeave,
    onNodeHover,
    onNodeLeave,
    onBrushZoom,
    onBrushSelectLinks,
    onBrushDeselectLinks,
    getNodeColor,
    valueLabel,
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
