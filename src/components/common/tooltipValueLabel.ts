const MATRIX_LABEL_SEPARATOR = " · ";

export const buildTooltipValueLabel = (matrixLabel?: string) => {
  const label = matrixLabel?.trim();
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
