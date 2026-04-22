import type { MatrixShape } from "@/types/matrix";

export const PREVIEW_SIZE = 280;
export const PREVIEW_PADDING = 24;
export const MATRIX_PREVIEW_HEIGHT = 96;

export const MATRIX_SHAPE_OPTIONS: Array<{ value: MatrixShape; label: string }> = [
  { value: "full", label: "Full matrix" },
  { value: "upper", label: "Upper triangular" },
  { value: "lower", label: "Lower triangular" },
];
