export const DEFAULT_LINK_WIDTH_RANGE: [number, number] = [0.6, 2.6];
export const NODELINK_TOOLTIP_OFFSET = 12;
export const LINK_COLOR = "#386f99";
export const LINK_POSITIVE = "#2f6f99";
export const LINK_NEGATIVE = "#d64545";
export const SELECTED_STROKE = 2.4;

export const buildRoiTooltipLabel = (label: string, acronym: string) => {
  const trimmedLabel = label.trim();
  const trimmedAcronym = acronym.trim();
  if (!trimmedLabel && !trimmedAcronym) return "";
  if (!trimmedAcronym || trimmedAcronym === trimmedLabel) return trimmedLabel;
  if (!trimmedLabel) return trimmedAcronym;
  return `${trimmedLabel} (${trimmedAcronym})`;
};
