import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as d3 from "d3";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import type { AtlasDefinition } from "@/types/atlas";
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
  renderCircularElements,
  type CircularLink as Link,
  type CircularNode as Node,
} from "@/components/circular/circularRenderStrategies";
import {
  applyCircularHoverSelectionStyles,
  syncCircularProgrammaticTooltip,
} from "@/components/circular/circularVisualEffects";

type CircularNodeLinkPanelProps = NodeLinkPanelCommonProps & {
  atlasDefinition?: AtlasDefinition | null;
  circularHierarchyFields?: string[];
  circularHierarchyCategoryOrder?: Record<string, string[]>;
};

const DEFAULT_MARGIN = 32;
const SELECTED_COLOR = "#d64545";

export default function CircularNodeLinkPanel({
  diverging,
  atlasDefinition = null,
  circularHierarchyFields = [],
  circularHierarchyCategoryOrder = {},
  ...props
}: CircularNodeLinkPanelProps) {
  return (
    <NodeLinkViewTemplate
      Renderer={CircularNodeLink}
      rendererProps={{
        atlasDefinition,
        circularHierarchyFields,
        circularHierarchyCategoryOrder,
      }}
      diverging={diverging ?? false}
      {...props}
    />
  );
}

type CircularNodeLinkProps = Omit<
  NodeLinkPanelCommonProps,
  "compoundId"
> &
  NodeLinkInteractionProps & {
  width: number;
  height: number;
  atlasDefinition?: AtlasDefinition | null;
  circularHierarchyFields?: string[];
  circularHierarchyCategoryOrder?: Record<string, string[]>;
};

function CircularNodeLink({
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const internalSvgRef = useRef<SVGSVGElement>(null);
  const svgRef = svgRefProp ?? internalSvgRef;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const [localHoverActive, setLocalHoverActive] = useState(false);
  const linkSelectionRef = useRef<
    d3.Selection<SVGPathElement, Link, SVGGElement, unknown> | null
  >(null);
  const nodeSelectionRef = useRef<
    d3.Selection<SVGCircleElement, Node, SVGGElement, unknown> | null
  >(null);
  const labelSelectionRef = useRef<
    d3.Selection<SVGTextElement, Node, SVGGElement, unknown> | null
  >(null);
  const widthScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
  const nodeRadiusRef = useRef<number>(3);
  const zoomLabelSetRef = useRef<Set<string> | null>(null);

  const baseLinks = useMemo(() => {
    return buildFilteredUndirectedLinks({
      data,
      labels,
      valueFilters,
    }).map((link: UndirectedLink) => ({ ...link }));
  }, [data, labels, valueFilters]);

  const degreeById = useMemo(() => buildDegreeByLabelId(baseLinks), [baseLinks]);

  const { nodes, links } = useMemo(() => {
    const totalCount = data.length;
    const visibleOriginalIndices = (
      hideIsolatedNodes
        ? Array.from({ length: totalCount }, (_, index) => index).filter((index) => {
            const labelId = labels?.[index] ?? String(index);
            return degreeById.has(labelId);
          })
        : Array.from({ length: totalCount }, (_, index) => index)
    ).map((originalIndex, fallbackOrder) => {
      const labelId = labels?.[originalIndex] ?? String(originalIndex);
      return {
        originalIndex,
        fallbackOrder,
        labelId,
      };
    });

    const radius = Math.max(
      0,
      Math.min(width, height) / 2 - DEFAULT_MARGIN,
    );
    const hierarchyLayout = buildCircularHierarchyLayout({
      labelIds: visibleOriginalIndices.map((item) => item.labelId),
      radius,
      atlasDefinition,
      hierarchyFields: circularHierarchyFields,
      categoryOrder: circularHierarchyCategoryOrder,
    });
    const hierarchyByLabel = new Map(
      hierarchyLayout.map((item) => [item.labelId, item] as const),
    );
    const orderedVisible = [...visibleOriginalIndices].sort((a, b) => {
      const orderA = hierarchyByLabel.get(a.labelId)?.order ?? a.fallbackOrder;
      const orderB = hierarchyByLabel.get(b.labelId)?.order ?? b.fallbackOrder;
      return orderA - orderB;
    });

    const indexMap = new Map<number, number>();
    orderedVisible.forEach((item, visibleIndex) => {
      indexMap.set(item.originalIndex, visibleIndex);
    });

    const count = orderedVisible.length;
    const nextNodes: Node[] = orderedVisible.map((item, visibleIndex) => {
      const layout = hierarchyByLabel.get(item.labelId);
      const angle =
        layout?.angle ??
        (count > 0 ? (visibleIndex / count) * Math.PI * 2 - Math.PI / 2 : 0);
      const labelId = labels?.[item.originalIndex];
      const displayLabel = labelId
        ? labelNames?.[labelId] ?? labelId
        : String(item.originalIndex);
      return {
        id: visibleIndex,
        labelId,
        label: displayLabel,
        angle,
        x: layout?.x ?? Math.cos(angle) * radius,
        y: layout?.y ?? Math.sin(angle) * radius,
      };
    });
    const nextLinks = baseLinks
      .map((link) => {
        const source = indexMap.get(link.source);
        const target = indexMap.get(link.target);
        if (source === undefined || target === undefined) return null;
        return { ...link, source, target };
      })
      .filter((link): link is Link => link !== null);

    return { nodes: nextNodes, links: nextLinks };
  }, [
    baseLinks,
    data,
    degreeById,
    hideIsolatedNodes,
    labels,
    labelNames,
    width,
    height,
    atlasDefinition,
    circularHierarchyFields,
    circularHierarchyCategoryOrder,
  ]);

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

    if (width <= 0 || height <= 0) return;

    const centerX = width / 2;
    const centerY = height / 2;

    const zoomRoot = svg.append("g").attr("class", "node-link-zoom-root");
    const root = zoomRoot
      .append("g")
      .attr("class", "node-link-root")
      .attr("transform", `translate(${centerX}, ${centerY})`);

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

    const degreeById = buildDegreeByLabelId(links);

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

    const nodeRadius = 3;
    nodeRadiusRef.current = nodeRadius;
    const { linkSelection, nodeSelection, labelSelection } = renderCircularElements({
      root,
      nodes,
      links,
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
    });
    linkSelectionRef.current =
      linkSelection as d3.Selection<SVGPathElement, Link, SVGGElement, unknown>;
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
          nodes.forEach((node) => {
            const x = node.x + centerX;
            const y = node.y + centerY;
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
    links,
    nodes,
    width,
    height,
    labels,
    labelNames,
    labelTitles,
    labelAcronyms,
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
  ]);

  useEffect(() => {
    const linkSelection = linkSelectionRef.current;
    const nodeSelection = nodeSelectionRef.current;
    const labelSelection = labelSelectionRef.current;
    const widthScale = widthScaleRef.current;
    if (!linkSelection || !nodeSelection || !labelSelection || !widthScale) {
      return;
    }

    applyCircularHoverSelectionStyles({
      linkSelection,
      nodeSelection,
      labelSelection,
      widthScale,
      zoomLabelSet: zoomLabelSetRef.current,
      nodeRadius: nodeRadiusRef.current ?? 3,
      hoveredCell,
      hoveredNodeId,
      selectedLinkIds,
      getNodeColor,
      selectedColor: SELECTED_COLOR,
    });
  }, [hoveredCell, hoveredNodeId, selectedLinkIds, getNodeColor]);

  useEffect(() => {
    const tooltipEl = tooltipRef.current;
    const wrapperEl = wrapperRef.current;
    if (!tooltipEl || !wrapperEl) return;
    if (localHoverActive) return;

    if (width <= 0 || height <= 0) {
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
    syncCircularProgrammaticTooltip({
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
    nodes,
    links,
    width,
    height,
    localHoverActive,
    degreeById,
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
