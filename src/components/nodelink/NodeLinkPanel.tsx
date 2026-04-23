import { useCallback, useMemo, useRef } from "react";
import NodeLinkViewTemplate from "@/components/nodelink/NodeLinkViewTemplate";
import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
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
  brushEnabled = false,
  geometricZoomEnabled = false,
  hideIsolatedNodes = true,
  diverging,
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
    brushEnabled,
    geometricZoomEnabled,
    hideIsolatedNodes,
    diverging,
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
