import type { AtlasLabel } from "@/types/atlas";

export const isAtlasLabelEnabled = (label?: Pick<AtlasLabel, "enabled"> | null) =>
  label?.enabled !== false;

export const getAtlasLabelName = (
  label: Pick<AtlasLabel, "label"> | undefined,
  fallbackId: string,
) => label?.label?.trim() || fallbackId;

export const getAtlasDisplayLabel = (
  label: Pick<AtlasLabel, "label" | "acronym"> | undefined,
  fallbackId: string,
) => {
  const name = getAtlasLabelName(label, fallbackId);
  const acronym = label?.acronym?.trim();
  return acronym && acronym !== name ? `${name} (${acronym})` : name;
};

export const getAtlasSearchText = (
  label: Pick<AtlasLabel, "label" | "acronym"> | undefined,
  fallbackId: string,
) =>
  [fallbackId, label?.label, label?.acronym]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ")
    .toLowerCase();
