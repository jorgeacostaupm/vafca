import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as d3 from "d3";
import NodeLinkViewTemplate from "@/components/nodelink/NodeLinkViewTemplate";
import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import {
  DEFAULT_LINK_WIDTH_RANGE,
  NODELINK_TOOLTIP_OFFSET,
} from "@/components/nodelink/nodelinkShared";
import {
  positionTooltipForCoordinates,
  positionTooltipForPointer,
} from "@/components/nodelink/tooltipPosition";
import type {
  NodeLinkInteractionProps,
  NodeLinkPanelCommonProps,
} from "@/components/nodelink/panelTypes";
import {
  buildDegreeByLabelId,
  buildFilteredUndirectedLinks,
  type UndirectedLink,
} from "@/components/nodelink/graphModel";
import {
  renderClassicElements,
  type ClassicLink as Link,
  type ClassicNode as Node,
} from "@/components/nodelink/classicRenderStrategies";
import {
  applyClassicHoverSelectionStyles,
  syncClassicProgrammaticTooltip,
} from "@/components/nodelink/classicVisualEffects";

type NodeLinkPanelProps = NodeLinkPanelCommonProps;

const DEFAULT_NODE_RADIUS = 3.5;
const DEFAULT_MARGIN = 20;
const HOVER_NODE_COLOR = "#d64545";

export default function NodeLinkPanel({
  ...props
}: NodeLinkPanelProps) {
  return <NodeLinkViewTemplate Renderer={NodeLink} rendererProps={{}} {...props} />;
}

type NodeLinkProps = Omit<
  NodeLinkPanelCommonProps,
  "compoundId"
> &
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = svgRefProp ?? internalSvgRef;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const [localHoverActive, setLocalHoverActive] = useState(false);
  const nodesRef = useRef<Node[] | null>(null);
  const linksRef = useRef<Link[] | null>(null);
  const degreeByIdRef = useRef<Map<string, number> | null>(null);
  const linkSelectionRef = useRef<
    d3.Selection<SVGLineElement, Link, SVGGElement, unknown> | null
  >(null);
  const nodeSelectionRef = useRef<
    d3.Selection<SVGCircleElement, Node, SVGGElement, unknown> | null
  >(null);
  const labelSelectionRef = useRef<
    d3.Selection<SVGTextElement, Node, SVGGElement, unknown> | null
  >(null);
  const widthScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
  const nodeRadiusRef = useRef<number>(DEFAULT_NODE_RADIUS);
  const zoomLabelSetRef = useRef<Set<string> | null>(null);

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

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const wrapperEl = wrapperRef.current;
    const tooltipEl = tooltipRef.current;
    if (tooltipEl) {
      tooltipEl.style.opacity = "0";
    }
    setLocalHoverActive(false);

    if (width <= 0 || height <= 0) {
      nodesRef.current = null;
      linksRef.current = null;
      degreeByIdRef.current = null;
      return;
    }

    const count = data.length;
    const nodes: Node[] = Array.from({ length: count }, (_, index) => {
      const labelId = labels?.[index];
      const displayLabel = labelId
        ? labelNames?.[labelId] ?? labelId
        : String(index);
      return {
        id: index,
        labelId,
        label: displayLabel,
      };
    });

    const links: Link[] = buildFilteredUndirectedLinks({
      data,
      labels,
      valueFilters,
    }).map((link: UndirectedLink) => ({ ...link }));
    const degreeById = buildDegreeByLabelId(links);
    degreeByIdRef.current = degreeById;
    const visibleNodeIndices = hideIsolatedNodes
      ? nodes
          .map((node, index) => ({ node, index }))
          .filter((entry) =>
            degreeById.has(entry.node.labelId ?? String(entry.node.id)),
          )
          .map((entry) => entry.index)
      : nodes.map((_, index) => index);
    const nextIndexByOriginal = new Map<number, number>();
    visibleNodeIndices.forEach((originalIndex, visibleIndex) => {
      nextIndexByOriginal.set(originalIndex, visibleIndex);
    });
    const simNodes = visibleNodeIndices.map((originalIndex, visibleIndex) => {
      const node = nodes[originalIndex];
      return { ...node, id: visibleIndex };
    });
    const simLinks = links.reduce<Link[]>((acc, link) => {
        const sourceIndex =
          typeof link.source === "number" ? link.source : (link.source as Node).id;
        const targetIndex =
          typeof link.target === "number" ? link.target : (link.target as Node).id;
        const source = nextIndexByOriginal.get(sourceIndex);
        const target = nextIndexByOriginal.get(targetIndex);
        if (source === undefined || target === undefined) return acc;
        acc.push({ ...link, source, target });
        return acc;
      }, []);
    linksRef.current = simLinks;

    const minDim = Math.min(width, height);
    const nodeRadius = Math.max(2.5, Math.min(DEFAULT_NODE_RADIUS, minDim / 50));
    const linkDistance = Math.max(40, Math.min(120, minDim / 2.5));
    nodeRadiusRef.current = nodeRadius;

    const simulation = d3
      .forceSimulation<Node>(simNodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(simLinks)
          .id((node) => node.id)
          .distance(linkDistance)
          .strength(0.7),
      )
      .force("charge", d3.forceManyBody().strength(-140))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(nodeRadius + 6))
      .stop();

    const iterations = Math.min(240, Math.max(120, count * 8));
    for (let i = 0; i < iterations; i += 1) {
      simulation.tick();
    }
    simulation.stop();
    nodesRef.current = simNodes;

    const clampX = (value: number | undefined) =>
      Math.max(
        DEFAULT_MARGIN,
        Math.min(width - DEFAULT_MARGIN, value ?? width / 2),
      );
    const clampY = (value: number | undefined) =>
      Math.max(
        DEFAULT_MARGIN,
        Math.min(height - DEFAULT_MARGIN, value ?? height / 2),
      );

    const widthRange = linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE;
    const extent = d3.extent(links, (link: Link) => Math.abs(link.value));
    const extentMin = Number.isFinite(extent[0]) ? (extent[0] as number) : 0;
    const extentMax = Number.isFinite(extent[1]) ? (extent[1] as number) : 1;
    const widthScale = d3
      .scaleLinear()
      .domain(
        extentMin === extentMax ? [0, extentMax || 1] : [extentMin, extentMax],
      )
      .range(widthRange)
      .clamp(true);
    widthScaleRef.current = widthScale;

    const zoomLabelSet =
      selectedZoomLabels && selectedZoomLabels.length > 0
        ? new Set(selectedZoomLabels)
        : null;
    zoomLabelSetRef.current = zoomLabelSet;

    const zoomRoot = svg.append("g").attr("class", "node-link-zoom-root");
    const root = zoomRoot.append("g").attr("class", "node-link-root");

    const showTooltip = (html: string, event: MouseEvent | PointerEvent) => {
      if (!tooltipEl || !wrapperEl) return;
      tooltipEl.innerHTML = html;
      tooltipEl.style.opacity = "1";
      setLocalHoverActive(true);
      const wrapperRect = wrapperEl.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const { left, top } = positionTooltipForPointer({
        event,
        wrapperRect,
        tooltipRect,
        offset: NODELINK_TOOLTIP_OFFSET,
      });
      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    };

    const moveTooltip = (event: MouseEvent | PointerEvent) => {
      if (!tooltipEl || !wrapperEl || tooltipEl.style.opacity !== "1") return;
      const wrapperRect = wrapperEl.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const { left, top } = positionTooltipForPointer({
        event,
        wrapperRect,
        tooltipRect,
        offset: NODELINK_TOOLTIP_OFFSET,
      });
      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    };

    const hideTooltip = () => {
      if (!tooltipEl) return;
      tooltipEl.style.opacity = "0";
      setLocalHoverActive(false);
    };

    const { linkSelection, nodeSelection, labelSelection } = renderClassicElements({
      root,
      simNodes,
      simLinks,
      width,
      height,
      diverging,
      labelNames,
      labelTitles,
      labelAcronyms,
      selectedLinkIds,
      widthScale,
      nodeRadius,
      zoomLabelSet,
      degreeById,
      onLabelToggle,
      onLinkSelect,
      onLinkHover,
      onLinkLeave,
      onNodeHover,
      onNodeLeave,
      getNodeColor,
      valueLabel,
      showTooltip,
      moveTooltip,
      hideTooltip,
      setLocalHoverActive,
      clampX,
      clampY,
      defaultMargin: DEFAULT_MARGIN,
    });
    linkSelectionRef.current =
      linkSelection as d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;
    nodeSelectionRef.current =
      nodeSelection as d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>;
    labelSelectionRef.current =
      labelSelection as d3.Selection<SVGTextElement, Node, SVGGElement, unknown>;

    if (geometricZoomEnabled) {
      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.6, 6])
        .filter((event: any) => {
          if (!brushEnabled) return !event.button;
          return event.type === "wheel";
        })
        .on("zoom", (event: any) => {
          zoomTransformRef.current = event.transform;
          zoomRoot.attr("transform", event.transform.toString());
        });

      const initialTransform = zoomTransformRef.current ?? d3.zoomIdentity;
      zoomRoot.attr("transform", initialTransform.toString());
      svg.call(zoomBehavior as unknown as d3.ZoomBehavior<
        SVGSVGElement,
        unknown
      >);
      svg.call(zoomBehavior.transform, initialTransform);
      svg.style("cursor", "grab");
    } else {
      zoomTransformRef.current = d3.zoomIdentity;
      zoomRoot.attr("transform", d3.zoomIdentity.toString());
      svg.on(".zoom", null);
      svg.style("cursor", "default");
    }

    if (brushEnabled) {
      const brushLayer = svg.append("g").attr("class", "node-link-brush");
      const brush = d3
        .brush()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("end", (event: any) => {
          if (!event.selection) return;
          hideTooltip();
          const [[x0, y0], [x1, y1]] = event.selection as [
            [number, number],
            [number, number],
          ];
          const transform = zoomTransformRef.current ?? d3.zoomIdentity;
          const [minX, minY] = transform.invert([
            Math.min(x0, x1),
            Math.min(y0, y1),
          ]);
          const [maxX, maxY] = transform.invert([
            Math.max(x0, x1),
            Math.max(y0, y1),
          ]);

          const selectedIds: string[] = [];
          simNodes.forEach((node) => {
            const x = clampX(node.x);
            const y = clampY(node.y);
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
              selectedIds.push(node.labelId ?? String(node.id));
            }
          });

          const selectedSet = new Set(selectedIds);
          const orderedSelection =
            labels && labels.length > 0
              ? labels.filter((label) => selectedSet.has(label))
              : selectedIds;

          if (orderedSelection.length > 0) {
            onBrushZoom?.({ labels: orderedSelection });
          }

          brushLayer.call(brush.move, null);
        });

      brushLayer.call(brush as unknown as d3.BrushBehavior<unknown>);
    }
  }, [
    data,
    labels,
    labelNames,
    labelTitles,
    labelAcronyms,
    width,
    height,
    valueFilters,
    selectedZoomLabels,
    linkWidthRange,
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
    hideIsolatedNodes,
  ]);

  useEffect(() => {
    const linkSelection = linkSelectionRef.current;
    const nodeSelection = nodeSelectionRef.current;
    const labelSelection = labelSelectionRef.current;
    const widthScale = widthScaleRef.current;
    if (!linkSelection || !nodeSelection || !labelSelection || !widthScale) {
      return;
    }

    applyClassicHoverSelectionStyles({
      linkSelection,
      nodeSelection,
      labelSelection,
      widthScale,
      zoomLabelSet: zoomLabelSetRef.current,
      nodeRadius: nodeRadiusRef.current ?? DEFAULT_NODE_RADIUS,
      hoveredCell,
      hoveredNodeId,
      selectedLinkIds,
      getNodeColor,
      hoverNodeColor: HOVER_NODE_COLOR,
    });
  }, [hoveredCell, hoveredNodeId, selectedLinkIds, getNodeColor]);

  useEffect(() => {
    const tooltipEl = tooltipRef.current;
    const wrapperEl = wrapperRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;
    const degreeById = degreeByIdRef.current;
    if (!tooltipEl || !wrapperEl) return;
    if (localHoverActive) return;

    if (width <= 0 || height <= 0 || !nodes || !links || !degreeById) {
      tooltipEl.style.opacity = "0";
      return;
    }

    const positionTooltip = (x: number, y: number, wrapperRect: DOMRect) => {
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const { left, top } = positionTooltipForCoordinates({
        x,
        y,
        wrapperRect,
        tooltipRect,
        offset: NODELINK_TOOLTIP_OFFSET,
      });
      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    };
    syncClassicProgrammaticTooltip({
      tooltipEl,
      wrapperEl,
      nodes,
      links,
      degreeById,
      hoveredCell,
      hoveredNodeId,
      labelNames,
      labelTitles,
      labelAcronyms,
      valueLabel,
      width,
      height,
      defaultMargin: DEFAULT_MARGIN,
      zoomTransform: zoomTransformRef.current ?? d3.zoomIdentity,
      positionTooltip,
    });
  }, [
    hoveredCell,
    hoveredNodeId,
    labelNames,
    labelTitles,
    labelAcronyms,
    valueLabel,
    width,
    height,
    localHoverActive,
  ]);

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
