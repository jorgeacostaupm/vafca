import {
  D3_GROUPING_PALETTES,
  type D3GroupingPaletteKey,
} from "@/config/groupingPalettes";
import type { AtlasDefinition, AtlasRoi } from "@/types/atlas";
import { getRoiFieldValue, normalizeRoiFieldValue } from "@/utils/atlas/atlasDefinition";

type RoiGroupingColorCategory = {
  key: string;
  values: string[];
  count: number;
  color: string;
};

const buildRoiGroupingValues = (roi: AtlasRoi, groupingFields: string[]) =>
  groupingFields.map((field) => normalizeRoiFieldValue(getRoiFieldValue(roi, field)));

export const buildGroupingColorCategoryKey = (values: string[]) => values.join("||");

export const buildRoiGroupingColorCategories = ({
  atlasDefinition,
  groupingFields,
  colorPalette,
  includedIds,
}: {
  atlasDefinition: AtlasDefinition | null;
  groupingFields: string[];
  colorPalette: D3GroupingPaletteKey;
  includedIds?: Set<string>;
}): RoiGroupingColorCategory[] => {
  if (!atlasDefinition?.rois?.length || groupingFields.length === 0) return [];

  const palette = D3_GROUPING_PALETTES[colorPalette].palette;
  const categories = new Map<string, { values: string[]; count: number }>();

  atlasDefinition.rois.forEach((roi) => {
    const id = String(roi.id);
    if (includedIds && !includedIds.has(id)) return;

    const values = buildRoiGroupingValues(roi, groupingFields);
    const key = buildGroupingColorCategoryKey(values);
    const current = categories.get(key);
    if (current) {
      current.count += 1;
      return;
    }
    categories.set(key, { values, count: 1 });
  });

  return Array.from(categories.entries())
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }))
    .map(([key, entry], index) => ({
      key,
      values: entry.values,
      count: entry.count,
      color: palette[index % palette.length],
    }));
};

export const buildRoiGroupingColorById = ({
  atlasDefinition,
  groupingFields,
  colorPalette,
}: {
  atlasDefinition: AtlasDefinition | null;
  groupingFields: string[];
  colorPalette: D3GroupingPaletteKey;
}) => {
  if (!atlasDefinition?.rois?.length) {
    return {} as Record<string, string>;
  }
  const palette = D3_GROUPING_PALETTES[colorPalette].palette;
  const fallbackColor = palette[0] ?? "#4e79a7";
  if (groupingFields.length === 0) {
    return atlasDefinition.rois.reduce<Record<string, string>>((acc, roi) => {
      acc[String(roi.id)] = fallbackColor;
      acc[String(roi.atlasId)] = fallbackColor;
      return acc;
    }, {});
  }

  const categories = buildRoiGroupingColorCategories({
    atlasDefinition,
    groupingFields,
    colorPalette,
  });
  const colorByCategory = new Map(categories.map((entry) => [entry.key, entry.color]));

  return atlasDefinition.rois.reduce<Record<string, string>>((acc, roi) => {
    const id = String(roi.id);
    const key = buildGroupingColorCategoryKey(
      buildRoiGroupingValues(roi, groupingFields),
    );
    const color = colorByCategory.get(key);
    if (color) {
      acc[id] = color;
      acc[String(roi.atlasId)] = color;
    }
    return acc;
  }, {});
};

const parseHexColor = (color: string): [number, number, number] | null => {
  if (!color.startsWith("#")) return null;
  const raw = color.slice(1);
  if (raw.length === 3) {
    const r = Number.parseInt(raw[0] + raw[0], 16);
    const g = Number.parseInt(raw[1] + raw[1], 16);
    const b = Number.parseInt(raw[2] + raw[2], 16);
    if (![r, g, b].every(Number.isFinite)) return null;
    return [r, g, b];
  }
  if (raw.length === 6) {
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    if (![r, g, b].every(Number.isFinite)) return null;
    return [r, g, b];
  }
  return null;
};

const srgbToLinear = (value: number) => {
  const normalized = value / 255;
  if (normalized <= 0.03928) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
};

export const getReadableTextColor = (
  backgroundColor: string,
  light = "#ffffff",
  dark = "#102030",
) => {
  const rgb = parseHexColor(backgroundColor);
  if (!rgb) return dark;

  const [r, g, b] = rgb;
  const luminance =
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b);

  return luminance > 0.45 ? dark : light;
};
