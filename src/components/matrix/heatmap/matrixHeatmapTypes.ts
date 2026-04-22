import type * as d3 from "d3";

export type MatrixMargin = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type HeatmapCellDatum = {
  row: number;
  col: number;
  value: number;
};

export type HeatmapHighlightSelections = {
  cell: d3.Selection<SVGRectElement, unknown, null, undefined>;
  rowTop: d3.Selection<SVGLineElement, unknown, null, undefined>;
  rowBottom: d3.Selection<SVGLineElement, unknown, null, undefined>;
  colLeft: d3.Selection<SVGLineElement, unknown, null, undefined>;
  colRight: d3.Selection<SVGLineElement, unknown, null, undefined>;
};

export type HeatmapLegendRange = {
  min: number;
  max: number;
};
