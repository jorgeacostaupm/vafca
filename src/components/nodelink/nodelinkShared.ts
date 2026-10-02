export const buildRoiTooltipLabel = (label: string, acronym: string) => {
  const trimmedLabel = label.trim();
  const trimmedAcronym = acronym.trim();
  if (!trimmedLabel && !trimmedAcronym) return "";
  if (!trimmedAcronym || trimmedAcronym === trimmedLabel) return trimmedLabel;
  if (!trimmedLabel) return trimmedAcronym;
  return `${trimmedLabel} (${trimmedAcronym})`;
};
