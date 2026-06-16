import { type RefObject,useMemo } from "react";

import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";
import MatrixHeatmap from "@/components/matrix/Matrix";
import { useMatrixHeatmapController } from "@/components/matrix/useMatrixController";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useMatrixColorEncoding } from "@/hooks/useMatrixColorEncoding";
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
  brushEnabled,
  brushMode,
  showAllLabels,
  selectedZoomLabels,
  selectionVisible = true,
  onLabelToggle,
  onBrushZoom,
}: MatrixHeatmapPanelProps) {
  const {
    labelNames,
    labelTitles,
    nodeColors: labelColors,
  } = useAtlasLabelPresentation();
  const { scaleType, scaleSettings, visualStyle } =
    useMatrixColorEncoding(valueDomain);
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
    symmetric,
  });

  const valueLabel = useMemo(
    () => buildTooltipValueLabel(networkLabel),
    [networkLabel],
  );

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
          onCellHover={handleHover}
          onCellLeave={handleLeave}
          onLabelHover={handleLabelHover}
          onLabelLeave={handleLeave}
          onCellSelect={handleSelect}
          brushEnabled={brushEnabled}
          brushMode={brushMode}
          showAllLabels={showAllLabels}
          onLabelToggle={onLabelToggle}
          onBrushZoom={onBrushZoom}
          onBrushSelectLinks={handleBrushSelectLinks}
          onBrushDeselectLinks={handleBrushDeselectLinks}
        />
      )}
    </ViewPanelTemplate>
  );
}
