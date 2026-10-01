import { useMemo } from 'react';
import { type RefObject } from "react";

import { useTooltipValueLabel } from "@/components/common/useTooltipValueLabel";
import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";
import MatrixHeatmap from "@/components/matrix/Matrix";
import { useMatrixHeatmapController } from "@/components/matrix/useMatrixController";
import { useAnnotationStyle } from '@/hooks/useAnnotationStyle';
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useMatrixColorEncoding } from "@/hooks/useMatrixColorEncoding";
import { useAppDispatch } from '@/store/hooks';
import { toggleAnnotationNode } from '@/store/slices/visualizationUi';
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type { ResolvedValueDomain } from "@/types/valueDomain";

type MatrixHeatmapPanelProps = {
  data: number[][];
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  compoundId: string;
  networkLabel: string;
  symmetric: boolean;
  svgRef?: RefObject<SVGSVGElement | null>;
  legendMin?: number;
  legendMax?: number;
  valueDomain?: ResolvedValueDomain;
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: [number, number] | Array<[number, number]> | null;
  };
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelColors?: Record<string, string>;
  brushEnabled?: boolean;
  brushMode?: MatrixBrushMode;
  showAllLabels?: boolean;
  selectedZoomLabels?: string[];
  selectionVisible?: boolean;
  onLabelToggle?: (label: string) => void;
  onBrushZoom?: (payload: {
    rowLabels: string[];
    colLabels: string[];
  }) => void;
};

export default function MatrixHeatmapPanel({
  data,
  labels,
  rowLabels,
  colLabels,
  compoundId,
  networkLabel,
  symmetric,
  svgRef,
  legendMin,
  legendMax,
  valueDomain,
  valueFilters,
  labelNames: labelNamesOverride,
  labelTitles: labelTitlesOverride,
  labelColors: labelColorsOverride,
  brushEnabled,
  brushMode,
  showAllLabels,
  selectedZoomLabels,
  selectionVisible = true,
  onLabelToggle,
  onBrushZoom,
}: MatrixHeatmapPanelProps) {
  const dispatch = useAppDispatch();
  const atlasPresentation = useAtlasLabelPresentation();
  const labelNames = labelNamesOverride ?? atlasPresentation.labelNames;
  const labelTitles = labelTitlesOverride ?? atlasPresentation.labelTitles;
  const labelColors = labelColorsOverride ?? atlasPresentation.nodeColors;
  const { scaleType, scaleSettings, visualStyle: baseStyle } =
    useMatrixColorEncoding(valueDomain);
  const annotationStyle = useAnnotationStyle(baseStyle, selectionVisible);
  const visualStyle = useMemo(() => {
    const rows = new Map((rowLabels ?? labels ?? []).map((id, index) => [id, index]));
    const cols = new Map((colLabels ?? labels ?? []).map((id, index) => [id, index]));
    const annotationCellColors: Record<string, string> = {};
    for (const [key, color] of Object.entries(annotationStyle.annotationLinkColors ?? {})) {
      const [rowId, colId] = key.split('::');
      const row = rows.get(rowId), col = cols.get(colId);
      if (row !== undefined && col !== undefined) annotationCellColors[`${row}::${col}`] = color;
    }
    return { ...annotationStyle, annotationCellColors };
  }, [annotationStyle, rowLabels, colLabels, labels]);
  const {
    selectedCells,
    handleHover,
    handleLeave,
    handleLabelHover,
    handleSelect,
    handleBrushSelectLinks,
    handleBrushDeselectLinks,
  } = useMatrixHeatmapController({
    data,
    labels,
    rowLabels,
    colLabels,
    labelNames,
    compoundId,
    networkLabel,
    selectionVisible,
  });

  const valueLabel = useTooltipValueLabel(compoundId, networkLabel);

  return (
    <ViewPanelTemplate>
      {({ width, height }) => (
        <MatrixHeatmap
          data={data}
          width={width}
          height={height}
          labels={labels}
          symmetric={symmetric}
          rowLabels={rowLabels}
          colLabels={colLabels}
          labelNames={labelNames}
          valueLabel={valueLabel}
          labelTitles={labelTitles}
          labelColors={labelColors}
          svgRef={svgRef}
          selectedZoomLabels={selectionVisible ? selectedZoomLabels : undefined}
          legendMin={legendMin}
          legendMax={legendMax}
          scaleType={scaleType}
          scaleCenter={valueDomain?.center ?? null}
          colorScaleSettings={scaleSettings}
          visualStyle={visualStyle}
          valueFilters={valueFilters}
          selectedCells={selectionVisible ? selectedCells : []}
          selectionVisible={selectionVisible}
          onCellHover={handleHover}
          onCellLeave={handleLeave}
          onLabelHover={handleLabelHover}
          onLabelLeave={handleLeave}
          onCellSelect={handleSelect}
          brushEnabled={brushEnabled}
          brushMode={brushMode}
          showAllLabels={showAllLabels}
          onLabelToggle={onLabelToggle ?? (id => dispatch(toggleAnnotationNode({ id, label: labelNames?.[id] ?? id })))}
          onBrushZoom={onBrushZoom}
          onBrushSelectLinks={handleBrushSelectLinks}
          onBrushDeselectLinks={handleBrushDeselectLinks}
        />
      )}
    </ViewPanelTemplate>
  );
}
