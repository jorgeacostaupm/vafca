import { escapeHtml } from "@/utils/html";

export type TooltipValueLabel = string | ((value: number, rowId: string, colId: string) => string);

export const formatTooltipValue = (label: TooltipValueLabel, value: number, rowId: string, colId: string) =>
  typeof label === "function" ? label(value, rowId, colId) : `<div>${escapeHtml(label)}: ${value.toFixed(4)}</div>`;

const MATRIX_LABEL_SEPARATOR = " · ";

export const buildTooltipValueLabel = (networkLabel?: string) => {
  const label = networkLabel?.trim();
  if (!label) return "Value";

  const parts = label
    .split(MATRIX_LABEL_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return `${parts[1]}${MATRIX_LABEL_SEPARATOR}${parts[2]}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}${MATRIX_LABEL_SEPARATOR}${parts[1]}`;
  }
  return parts[0] ?? "Value";
};
