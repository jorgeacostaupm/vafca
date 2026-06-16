import type { ComponentType } from "react";
import { useMemo } from "react";

import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";
import { useNodeLinkPanelInteractions } from "@/components/nodelink/useNodeLinkPanelInteractions";
import { createCircularLinkColorResolver } from "@/config/matrixColorScales";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useMatrixColorEncoding } from "@/hooks/useMatrixColorEncoding";
import { useAppSelector } from "@/store/hooks";
import { selectNodeLinkVisualStyle } from "@/store/slices/visualizationUi";
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

const EMPTY_SELECTED_LINK_IDS = new Set<string>();

export default function NodeLinkViewTemplate<TExtra extends object>({
  Renderer,
  rendererProps,
  data,
  labels,
  compoundId,
  networkLabel,
  svgRef,
  valueFilters,
  selectedZoomLabels,
  linkWidthRange,
  valueDomain,
  circularLinkTension,
  circularBundlingEnabled,
  circularPositiveLinkColor,
  circularNegativeLinkColor,
  brushEnabled,
  brushMode,
  geometricZoomEnabled,
  hideIsolatedNodes,
  selectionVisible = true,
  onLabelToggle,
  onBrushZoom,
}: NodeLinkViewTemplateProps<TExtra>) {
  const { labelNames, labelTitles, labelAcronyms, nodeColors } =
    useAtlasLabelPresentation();
  const visualStyle = useAppSelector(selectNodeLinkVisualStyle);
  const { colorResolver: matrixLinkColorResolver } = useMatrixColorEncoding(valueDomain);
  const linkColorResolver = useMemo(
    () =>
      circularPositiveLinkColor && circularNegativeLinkColor
        ? createCircularLinkColorResolver({
            positive: circularPositiveLinkColor,
            negative: circularNegativeLinkColor,
          })
        : matrixLinkColorResolver,
    [circularNegativeLinkColor, circularPositiveLinkColor, matrixLinkColorResolver],
  );
  const {
    resolvedLabels,
    selectedLinkIds,
    handleSelect,
    handleLinkHover,
    handleLinkLeave,
    handleNodeHover,
    handleNodeLeave,
    handleBrushSelectLinks,
    handleBrushDeselectLinks,
  } = useNodeLinkPanelInteractions({
    data,
    labels,
    compoundId,
    networkLabel,
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
          networkLabel={networkLabel}
          width={width}
          height={height}
          svgRef={svgRef}
          valueFilters={valueFilters}
          selectedZoomLabels={selectionVisible ? selectedZoomLabels : undefined}
          linkWidthRange={linkWidthRange}
          valueDomain={valueDomain}
          circularLinkTension={circularLinkTension}
          circularBundlingEnabled={circularBundlingEnabled}
          circularPositiveLinkColor={circularPositiveLinkColor}
          circularNegativeLinkColor={circularNegativeLinkColor}
          brushEnabled={brushEnabled}
          brushMode={brushMode}
          geometricZoomEnabled={geometricZoomEnabled}
          hideIsolatedNodes={hideIsolatedNodes}
          selectedLinkIds={selectionVisible ? selectedLinkIds : EMPTY_SELECTED_LINK_IDS}
          visualStyle={visualStyle}
          linkColorResolver={linkColorResolver}
          onLabelToggle={onLabelToggle}
          onLinkSelect={handleSelect}
          onLinkHover={handleLinkHover}
          onLinkLeave={handleLinkLeave}
          onNodeHover={handleNodeHover}
          onNodeLeave={handleNodeLeave}
          onBrushZoom={onBrushZoom}
          onBrushSelectLinks={handleBrushSelectLinks}
          onBrushDeselectLinks={handleBrushDeselectLinks}
        />
      )}
    </ViewPanelTemplate>
  );
}
