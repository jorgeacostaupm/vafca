import {
  NETWORK_LINK_COLOR,
  NETWORK_LINK_NEGATIVE_COLOR,
  NETWORK_LINK_POSITIVE_COLOR,
} from "@/theme";

export const getLinkStrokeColor = (value: number, diverging?: boolean) => {
  if (!diverging) return NETWORK_LINK_COLOR;
  return value >= 0 ? NETWORK_LINK_POSITIVE_COLOR : NETWORK_LINK_NEGATIVE_COLOR;
};

export const buildRoiTooltipLabel = (label: string, acronym: string) => {
  const trimmedLabel = label.trim();
  const trimmedAcronym = acronym.trim();
  if (!trimmedLabel && !trimmedAcronym) return "";
  if (!trimmedAcronym || trimmedAcronym === trimmedLabel) return trimmedLabel;
  if (!trimmedLabel) return trimmedAcronym;
  return `${trimmedLabel} (${trimmedAcronym})`;
};
