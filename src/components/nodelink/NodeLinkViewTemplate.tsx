import type { ComponentType } from "react";
import { useNodeLinkPanelInteractions } from "@/components/nodelink/useNodeLinkPanelInteractions";
import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import type {
  NodeLinkInteractionProps,
  NodeLinkPanelCommonProps,
  NodeLinkPresentationProps,
} from "@/types/nodelink";

type NodeLinkRendererBaseProps = Omit<
  NodeLinkPanelCommonProps,
  "compoundId"
> &
  NodeLinkPresentationProps & {
    width: number;
    height: number;
  };

type NodeLinkViewTemplateProps<TExtra extends object> = NodeLinkPanelCommonProps & {
  Renderer: ComponentType<NodeLinkRendererBaseProps & NodeLinkInteractionProps & TExtra>;
  rendererProps: TExtra;
};

export default function NodeLinkViewTemplate<TExtra extends object>({
  Renderer,
  rendererProps,
  data,
  labels,
  compoundId,
  matrixLabel,
  svgRef,
  valueFilters,
  selectedZoomLabels,
  linkWidthRange,
  brushEnabled,
  geometricZoomEnabled,
  hideIsolatedNodes,
  diverging = false,
  onLabelToggle,
  onBrushZoom,
}: NodeLinkViewTemplateProps<TExtra>) {
  const { labelNames, labelTitles, labelAcronyms, nodeColors } =
    useAtlasLabelPresentation();
  const {
    resolvedLabels,
    selectedLinkIds,
    hoveredCell,
    hoveredNodeId,
    handleSelect,
    handleLinkHover,
    handleLinkLeave,
    handleNodeHover,
    handleNodeLeave,
  } = useNodeLinkPanelInteractions({
    data,
    labels,
    compoundId,
    matrixLabel,
  });

  return (
    <ViewPanelTemplate>
      {({ width, height }) => (
        <Renderer
          {...rendererProps}
          data={data}
          labels={resolvedLabels}
          labelNames={labelNames}
          labelTitles={labelTitles}
          labelAcronyms={labelAcronyms}
          nodeColors={nodeColors}
          matrixLabel={matrixLabel}
          width={width}
          height={height}
          svgRef={svgRef}
          valueFilters={valueFilters}
          selectedZoomLabels={selectedZoomLabels}
          linkWidthRange={linkWidthRange}
          brushEnabled={brushEnabled}
          geometricZoomEnabled={geometricZoomEnabled}
          hideIsolatedNodes={hideIsolatedNodes}
          diverging={diverging}
          selectedLinkIds={selectedLinkIds}
          hoveredCell={hoveredCell}
          hoveredNodeId={hoveredNodeId}
          onLabelToggle={onLabelToggle}
          onLinkSelect={handleSelect}
          onLinkHover={handleLinkHover}
          onLinkLeave={handleLinkLeave}
          onNodeHover={handleNodeHover}
          onNodeLeave={handleNodeLeave}
          onBrushZoom={onBrushZoom}
        />
      )}
    </ViewPanelTemplate>
  );
}
