import { type MutableRefObject } from "react";
import * as d3 from "d3";
import type { HeatmapProps } from "@/types/matrixHeatmap";

export const renderHeatmapBrush = (args: {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  size: number;
  rows: number;
  cols: number;
  xScale: d3.ScaleBand<number>;
  yScale: d3.ScaleBand<number>;
  resolvedRowLabels?: string[];
  resolvedColLabels?: string[];
  brushCbRef: MutableRefObject<HeatmapProps["onBrushZoom"] | undefined>;
}) => {
  const {
    root,
    size,
    rows,
    cols,
    xScale,
    yScale,
    resolvedRowLabels,
    resolvedColLabels,
    brushCbRef,
  } = args;

  const brushLayer = root.append("g").attr("class", "heatmap-brush");

  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [size, size],
    ])
    .on("end", (event) => {
      if (!event.selection) return;

      const [[x0, y0], [x1, y1]] = event.selection as [
        [number, number],
        [number, number],
      ];

      const selectedCols: number[] = [];
      const selectedRows: number[] = [];

      for (let col = 0; col < cols; col += 1) {
        const x = xScale(col) ?? 0;
        const width = xScale.bandwidth();
        if (x + width >= x0 && x <= x1) {
          selectedCols.push(col);
        }
      }

      for (let row = 0; row < rows; row += 1) {
        const y = yScale(row) ?? 0;
        const height = yScale.bandwidth();
        if (y + height >= y0 && y <= y1) {
          selectedRows.push(row);
        }
      }

      const rowLabels =
        resolvedRowLabels && selectedRows.length > 0
          ? selectedRows.map((row) => resolvedRowLabels[row] ?? String(row))
          : selectedRows.map((row) => String(row));

      const colLabels =
        resolvedColLabels && selectedCols.length > 0
          ? selectedCols.map((col) => resolvedColLabels[col] ?? String(col))
          : selectedCols.map((col) => String(col));

      brushCbRef.current?.({
        rows: selectedRows,
        cols: selectedCols,
        rowLabels,
        colLabels,
      });

      brushLayer.call(brush.move, null);
    });

  brushLayer.call(brush as unknown as d3.BrushBehavior<unknown>);
};
