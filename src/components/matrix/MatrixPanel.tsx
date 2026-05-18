import { useMemo, type RefObject } from "react";
import MatrixHeatmap from "@/components/matrix/Matrix";
import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import { useMatrixHeatmapController } from "@/components/matrix/useMatrixController";
import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";

type MatrixHeatmapPanelProps = {
  data: number[][];
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  compoundId: string;
  matrixLabel: string;
  svgRef?: RefObject<SVGSVGElement>;
  legendMin?: number;
  legendMax?: number;
  invertColorScale?: boolean;
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: [number, number] | Array<[number, number]> | null;
  };
  brushEnabled?: boolean;
  showAllLabels?: boolean;
  selectedZoomLabels?: string[];
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
  matrixLabel,
  svgRef,
  legendMin,
  legendMax,
  invertColorScale,
  valueFilters,
  brushEnabled,
  showAllLabels,
  selectedZoomLabels,
  onLabelToggle,
  onBrushZoom,
}: MatrixHeatmapPanelProps) {
  const {
    labelNames,
    labelTitles,
    labelAcronyms,
    nodeColors: labelColors,
  } = useAtlasLabelPresentation();
  const {
    hoveredCell,
    selectedCells,
    handleHover,
    handleLeave,
    handleSelect,
  } = useMatrixHeatmapController({
    data,
    labels,
    rowLabels,
    colLabels,
    labelNames,
    compoundId,
    matrixLabel,
  });

  const valueLabel = useMemo(
    () => buildTooltipValueLabel(matrixLabel),
    [matrixLabel],
  );

  return (
    <ViewPanelTemplate>
      {({ width, height }) => (
        <MatrixHeatmap
          data={data}
          width={width}
          height={height}
          labels={labels}
          rowLabels={rowLabels}
          colLabels={colLabels}
          labelNames={labelNames}
          valueLabel={valueLabel}
          labelTitles={labelTitles}
          labelAcronyms={labelAcronyms}
          labelColors={labelColors}
          svgRef={svgRef}
          selectedZoomLabels={selectedZoomLabels}
          legendMin={legendMin}
          legendMax={legendMax}
          invertColorScale={invertColorScale}
          valueFilters={valueFilters}
          hoveredCell={hoveredCell}
          selectedCells={selectedCells}
          onCellHover={handleHover}
          onCellLeave={handleLeave}
          onCellSelect={handleSelect}
          brushEnabled={brushEnabled}
          showAllLabels={showAllLabels}
          onLabelToggle={onLabelToggle}
          onBrushZoom={onBrushZoom}
        />
      )}
    </ViewPanelTemplate>
  );
}
