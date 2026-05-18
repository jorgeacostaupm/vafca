import type { RefObject } from "react";
import type { MatrixValueRange } from "@/types/matrixView";

export type HeatmapProps = {
  data: number[][];
  width: number;
  height: number;
  title?: string;
  valueLabel?: string;
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  labelColors?: Record<string, string>;
  brushEnabled?: boolean;
  showAllLabels?: boolean;
  selectedZoomLabels?: string[];
  legendMin?: number;
  legendMax?: number;
  invertColorScale?: boolean;
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: MatrixValueRange;
  };
  hoveredCell?: { rowId: string; colId: string } | null;
  selectedCells?: Array<{ row: number; col: number }>;
  svgRef?: RefObject<SVGSVGElement>;
  onCellHover?: (payload: {
    row: number;
    col: number;
    value: number;
    rowId: string;
    colId: string;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onCellLeave?: () => void;
  onCellSelect?: (payload: {
    row: number;
    col: number;
    value: number;
    rowId: string;
    colId: string;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onBrushZoom?: (payload: {
    rows: number[];
    cols: number[];
    rowLabels: string[];
    colLabels: string[];
  }) => void;
  onLabelToggle?: (label: string) => void;
};
