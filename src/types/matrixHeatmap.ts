import type { RefObject } from "react";

import type { MatrixValueRange } from "@/types/matrixView";
import type { ScaleType } from "@/types/network";
import type {
  MatrixColorScaleSettings,
  MatrixVisualStyle,
} from "@/types/visualizationUi";

export type MatrixBrushMode = "zoom" | "selectLinks" | "deselectLinks";

export type MatrixBrushCell = {
  row: number;
  col: number;
  rowLabel: string;
  colLabel: string;
  value: number;
};

export type MatrixBrushPayload = {
  rows: number[];
  cols: number[];
  rowLabels: string[];
  colLabels: string[];
  cells: MatrixBrushCell[];
};

export type HeatmapProps = {
  data: number[][];
  width: number;
  height: number;
  title?: string;
  valueLabel?: string;
  symmetric?: boolean;
  labels?: string[];
  rowLabels?: string[];
  colLabels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  labelColors?: Record<string, string>;
  brushEnabled?: boolean;
  brushMode?: MatrixBrushMode;
  showAllLabels?: boolean;
  selectedZoomLabels?: string[];
  legendMin?: number;
  legendMax?: number;
  scaleType?: ScaleType;
  scaleCenter?: number | null;
  colorScaleSettings?: MatrixColorScaleSettings;
  visualStyle?: MatrixVisualStyle;
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: MatrixValueRange;
  };
  selectedCells?: Array<{ row: number; col: number }>;
  svgRef?: RefObject<SVGSVGElement | null>;
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
  onLabelHover?: (labelId: string) => void;
  onLabelLeave?: () => void;
  onCellSelect?: (payload: {
    row: number;
    col: number;
    value: number;
    rowId: string;
    colId: string;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onBrushZoom?: (payload: MatrixBrushPayload) => void;
  onBrushSelectLinks?: (payload: MatrixBrushPayload) => void;
  onBrushDeselectLinks?: (payload: MatrixBrushPayload) => void;
  onLabelToggle?: (label: string) => void;
};
