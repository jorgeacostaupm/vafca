import { useMemo, type RefObject } from "react";
import MatrixHeatmap from "@/components/matrix/Matrix";
import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import type { MatrixShape } from "@/types/matrix";
import { useMatrixHeatmapController } from "@/components/matrix/useMatrixController";
import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useAppSelector } from "@/store/hooks";

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
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: [number, number] | Array<[number, number]> | null;
  };
  brushEnabled?: boolean;
  showAllLabels?: boolean;
  selectedZoomLabels?: string[];
  matrixShape?: MatrixShape;
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
  valueFilters,
  brushEnabled,
  showAllLabels,
  selectedZoomLabels,
  matrixShape,
  onLabelToggle,
  onBrushZoom,
}: MatrixHeatmapPanelProps) {
  const configuredMatrixShape = useAppSelector(
    (state) => state.visualizationUi.matrixShape,
  );
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
          matrixShape={matrixShape ?? configuredMatrixShape}
          legendMin={legendMin}
          legendMax={legendMax}
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
