import type { ComponentType } from "react";
import { useMemo } from "react";

import { useTooltipValueLabel } from "@/components/common/useTooltipValueLabel";
import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";
import { useNodeLinkPanelInteractions } from "@/components/nodelink/useNodeLinkPanelInteractions";
import { createCircularLinkColorResolver } from "@/config/matrixColorScales";
import { useAnnotationStyle } from '@/hooks/useAnnotationStyle'
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useMatrixColorEncoding } from "@/hooks/useMatrixColorEncoding";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleAnnotationNode } from '@/store/slices/visualizationUi';
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
  visualStyleOverride,
  labelNames: labelNamesOverride,
  labelTitles: labelTitlesOverride,
  labelAcronyms: labelAcronymsOverride,
  nodeColors: nodeColorsOverride,
  brushEnabled,
  brushMode,
  geometricZoomEnabled,
  hideIsolatedNodes,
  selectionVisible = true,
  onLabelToggle,
  onBrushZoom,
}: NodeLinkViewTemplateProps<TExtra>) {
  const valueLabel = useTooltipValueLabel(compoundId, networkLabel);
  const dispatch = useAppDispatch();
  const atlasPresentation = useAtlasLabelPresentation();
  const labelNames = labelNamesOverride ?? atlasPresentation.labelNames;
  const labelTitles = labelTitlesOverride ?? atlasPresentation.labelTitles;
  const labelAcronyms = labelAcronymsOverride ?? atlasPresentation.labelAcronyms;
  const nodeColors = nodeColorsOverride ?? atlasPresentation.nodeColors;
  const nodeLinkVisualStyle = useAppSelector(selectNodeLinkVisualStyle);
  const visualStyle = useAnnotationStyle(visualStyleOverride ?? nodeLinkVisualStyle, selectionVisible);
  const { colorResolver: matrixLinkColorResolver } = useMatrixColorEncoding(valueDomain);
  const positiveLinkColor =
    circularPositiveLinkColor ?? visualStyle.positiveLinkColor;
  const negativeLinkColor =
    circularNegativeLinkColor ?? visualStyle.negativeLinkColor;
  const linkColorResolver = useMemo(
    () =>
      positiveLinkColor && negativeLinkColor
        ? createCircularLinkColorResolver({
            positive: positiveLinkColor,
            negative: negativeLinkColor,
          })
        : matrixLinkColorResolver,
    [matrixLinkColorResolver, negativeLinkColor, positiveLinkColor],
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
          valueLabel={valueLabel}
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
          onLabelToggle={onLabelToggle ?? (id => dispatch(toggleAnnotationNode({ id, label: labelNames?.[id] ?? id })))}
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
