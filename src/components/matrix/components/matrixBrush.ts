import * as d3 from "d3";
import { type MutableRefObject } from "react";

import type { HeatmapProps, MatrixBrushCell } from "@/types/matrixHeatmap";

export const renderHeatmapBrush = (args: {
  root: d3.Selection<SVGGElement, unknown, null, undefined>;
  size: number;
  rows: number;
  cols: number;
  data: number[][];
  xScale: d3.ScaleBand<number>;
  yScale: d3.ScaleBand<number>;
  resolvedRowLabels?: string[];
  resolvedColLabels?: string[];
  brushCbRef: MutableRefObject<HeatmapProps["onBrushZoom"] | undefined>;
  brushSelectLinksCbRef: MutableRefObject<
    HeatmapProps["onBrushSelectLinks"] | undefined
  >;
  brushDeselectLinksCbRef: MutableRefObject<
    HeatmapProps["onBrushDeselectLinks"] | undefined
  >;
  brushMode: NonNullable<HeatmapProps["brushMode"]>;
}) => {
  const {
    root,
    size,
    rows,
    cols,
    data,
    xScale,
    yScale,
    resolvedRowLabels,
    resolvedColLabels,
    brushCbRef,
    brushSelectLinksCbRef,
    brushDeselectLinksCbRef,
    brushMode,
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

      const cells: MatrixBrushCell[] = [];
      for (let rowIndex = 0; rowIndex < selectedRows.length; rowIndex += 1) {
        const row = selectedRows[rowIndex];
        if (row === undefined) continue;
        const rowLabel = rowLabels[rowIndex] ?? String(row);

        for (let colIndex = 0; colIndex < selectedCols.length; colIndex += 1) {
          const col = selectedCols[colIndex];
          if (col === undefined) continue;
          const value = data[row]?.[col];
          if (!Number.isFinite(value)) continue;

          cells.push({
            row,
            col,
            rowLabel,
            colLabel: colLabels[colIndex] ?? String(col),
            value: value as number,
          });
        }
      }

      const payload = {
        rows: selectedRows,
        cols: selectedCols,
        rowLabels,
        colLabels,
        cells,
      };

      if (brushMode === "selectLinks") {
        brushSelectLinksCbRef.current?.(payload);
      } else if (brushMode === "deselectLinks") {
        brushDeselectLinksCbRef.current?.(payload);
      } else {
        brushCbRef.current?.(payload);
      }

      brushLayer.call(brush.move, null);
    });

  brushLayer.call(brush as unknown as d3.BrushBehavior<unknown>);
};
