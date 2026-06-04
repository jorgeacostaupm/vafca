import { useCallback, useMemo, useRef } from "react";

import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import NodeLinkViewTemplate from "@/components/nodelink/NodeLinkViewTemplate";
import { useClassicNodeLinkScene } from "@/components/nodelink/useNodeLinkScene";
import type {
  ClassicNode,
  NodeLinkInteractionProps,
  NodeLinkPanelCommonProps,
  NodeLinkPresentationProps,
} from "@/types/nodelink";

type NodeLinkPanelProps = NodeLinkPanelCommonProps;

export default function NodeLinkPanel({
  ...props
}: NodeLinkPanelProps) {
  return <NodeLinkViewTemplate Renderer={NodeLink} rendererProps={{}} {...props} />;
}

type NodeLinkProps = Omit<NodeLinkPanelCommonProps, "compoundId"> &
  NodeLinkPresentationProps &
  NodeLinkInteractionProps & {
    width: number;
    height: number;
  };

function NodeLink({
  data,
  matrixLabel,
  labels,
  labelNames,
  labelTitles,
  labelAcronyms,
  nodeColors,
  width,
  height,
  svgRef: svgRefProp,
  valueFilters,
  selectedZoomLabels,
  linkWidthRange,
  valueDomain,
  brushEnabled = false,
  brushMode = "zoom",
  geometricZoomEnabled = false,
  hideIsolatedNodes = true,
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
}: NodeLinkProps) {
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = svgRefProp ?? internalSvgRef;

  const getNodeColor = useCallback(
    (node: ClassicNode) => {
      const labelId = node.labelId ?? String(node.id);
      return nodeColors?.[labelId] ?? "#1b2b38";
    },
    [nodeColors],
  );

  const valueLabel = useMemo(() => buildTooltipValueLabel(matrixLabel), [matrixLabel]);

  const { wrapperRef, tooltipRef } = useClassicNodeLinkScene({
    data,
    labels,
    labelNames,
    labelTitles,
    labelAcronyms,
    width,
    height,
    svgRef,
    valueFilters,
    selectedZoomLabels,
    linkWidthRange,
    valueDomain,
    brushEnabled,
    brushMode,
    geometricZoomEnabled,
    hideIsolatedNodes,
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
