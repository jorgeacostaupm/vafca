import type { MatrixMargin } from "@/components/matrix/components/matrixTypes";
import {
  MATRIX_HOVER_AXIS_GAP,
  MATRIX_HOVER_AXIS_STROKE,
  MATRIX_SELECTED_CELL_ACCENT_STROKE,
  MATRIX_SELECTED_CELL_INSET,
} from "@/config/ui";
import { VISUAL_HIGHLIGHT_COLOR, VISUAL_SELECTION_COLOR } from "@/theme";

export const BASE_MARGIN: MatrixMargin = {
  top: 54,
  right: 72,
  bottom: 10,
  left: 54,
};

export const HIGHLIGHT_COLOR = VISUAL_HIGHLIGHT_COLOR;
export const HIGHLIGHT_GAP = MATRIX_HOVER_AXIS_GAP;
export const HIGHLIGHT_AXIS_STROKE = MATRIX_HOVER_AXIS_STROKE;

export const SELECTED_COLOR = VISUAL_SELECTION_COLOR;
export const SELECTED_INSET = MATRIX_SELECTED_CELL_INSET;
export const SELECTED_STROKE = MATRIX_SELECTED_CELL_ACCENT_STROKE;
