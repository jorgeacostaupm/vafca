import { useMemo, type RefObject } from "react";
import { useAppSelector } from "@/store/hooks";
import MatrixHeatmap from "@/components/matrix/MatrixHeatmap";
import { buildTooltipValueLabel } from "@/components/common/tooltipValueLabel";
import type { MatrixShape } from "@/types/matrix";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { buildAtlasRoiColorById } from "@/utils/atlas/coloring";
import { useMatrixHeatmapController } from "@/components/matrix/useMatrixHeatmapController";
import ViewPanelTemplate from "@/components/layout/ViewPanelTemplate";

type MatrixHeatmapPanelProps = {
  data: number[][];
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
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
  labelNames,
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
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );
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

  const labelColors = useMemo(
    () =>
      buildAtlasRoiColorById({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      }),
    [atlas.colorFields, atlas.colorPalette, atlasDefinition],
  );
  const labelTitles = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.label ?? id;
        return acc;
      }, {}),
    [atlas.order, atlas.labelsById],
  );
  const labelAcronyms = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.acronym?.trim() ? meta.acronym : id;
        return acc;
      }, {}),
    [atlas.order, atlas.labelsById],
  );
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
          matrixShape={matrixShape}
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
