import type { AtlasDefinition, AtlasRoi } from "@/types/atlas";
import { normalizeRoiFieldValue } from "@/utils/atlas/atlasDefinition";

export type D3CategoricalPaletteKey =
  | "category10"
  | "tableau10"
  | "accent"
  | "dark2"
  | "paired"
  | "pastel1"
  | "pastel2"
  | "set1"
  | "set2"
  | "set3";

export const DEFAULT_D3_CATEGORICAL_PALETTE: D3CategoricalPaletteKey =
  "tableau10";

export const D3_CATEGORICAL_PALETTES: Record<D3CategoricalPaletteKey, string[]> = {
  category10: [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
  ],
  tableau10: [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc948",
    "#b07aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ab",
  ],
  accent: [
    "#7fc97f",
    "#beaed4",
    "#fdc086",
    "#ffff99",
    "#386cb0",
    "#f0027f",
    "#bf5b17",
    "#666666",
  ],
  dark2: [
    "#1b9e77",
    "#d95f02",
    "#7570b3",
    "#e7298a",
    "#66a61e",
    "#e6ab02",
    "#a6761d",
    "#666666",
  ],
  paired: [
    "#a6cee3",
    "#1f78b4",
    "#b2df8a",
    "#33a02c",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00",
    "#cab2d6",
    "#6a3d9a",
    "#ffff99",
    "#b15928",
  ],
  pastel1: [
    "#fbb4ae",
    "#b3cde3",
    "#ccebc5",
    "#decbe4",
    "#fed9a6",
    "#ffffcc",
    "#e5d8bd",
    "#fddaec",
    "#f2f2f2",
  ],
  pastel2: [
    "#b3e2cd",
    "#fdcdac",
    "#cbd5e8",
    "#f4cae4",
    "#e6f5c9",
    "#fff2ae",
    "#f1e2cc",
    "#cccccc",
  ],
  set1: [
    "#e41a1c",
    "#377eb8",
    "#4daf4a",
    "#984ea3",
    "#ff7f00",
    "#ffff33",
    "#a65628",
    "#f781bf",
    "#999999",
  ],
  set2: [
    "#66c2a5",
    "#fc8d62",
    "#8da0cb",
    "#e78ac3",
    "#a6d854",
    "#ffd92f",
    "#e5c494",
    "#b3b3b3",
  ],
  set3: [
    "#8dd3c7",
    "#ffffb3",
    "#bebada",
    "#fb8072",
    "#80b1d3",
    "#fdb462",
    "#b3de69",
    "#fccde5",
    "#d9d9d9",
    "#bc80bd",
    "#ccebc5",
    "#ffed6f",
  ],
};

type AtlasColorCategory = {
  key: string;
  values: string[];
  count: number;
  color: string;
};

const buildCategoryValues = (roi: AtlasRoi, colorFields: string[]) =>
  colorFields.map((field) => normalizeRoiFieldValue(roi[field]));

const buildCategoryKey = (values: string[]) => values.join("||");

export const buildAtlasColorCategories = ({
  atlasDefinition,
  colorFields,
  colorPalette,
  includedIds,
}: {
  atlasDefinition: AtlasDefinition | null;
  colorFields: string[];
  colorPalette: D3CategoricalPaletteKey;
  includedIds?: Set<string>;
}): AtlasColorCategory[] => {
  if (!atlasDefinition?.rois?.length || colorFields.length === 0) return [];

  const palette = D3_CATEGORICAL_PALETTES[colorPalette];
  const categories = new Map<string, { values: string[]; count: number }>();

  atlasDefinition.rois.forEach((roi) => {
    const id = String(roi.id);
    if (includedIds && !includedIds.has(id)) return;

    const values = buildCategoryValues(roi, colorFields);
    const key = buildCategoryKey(values);
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

export const buildAtlasRoiColorById = ({
  atlasDefinition,
  colorFields,
  colorPalette,
}: {
  atlasDefinition: AtlasDefinition | null;
  colorFields: string[];
  colorPalette: D3CategoricalPaletteKey;
}) => {
  if (!atlasDefinition?.rois?.length) {
    return {} as Record<string, string>;
  }
  const palette = D3_CATEGORICAL_PALETTES[colorPalette];
  const fallbackColor = palette[0] ?? "#4e79a7";
  if (colorFields.length === 0) {
    return atlasDefinition.rois.reduce<Record<string, string>>((acc, roi) => {
      acc[String(roi.id)] = fallbackColor;
      return acc;
    }, {});
  }

  const categories = buildAtlasColorCategories({
    atlasDefinition,
    colorFields,
    colorPalette,
  });
  const colorByCategory = new Map(categories.map((entry) => [entry.key, entry.color]));

  return atlasDefinition.rois.reduce<Record<string, string>>((acc, roi) => {
    const id = String(roi.id);
    const key = buildCategoryKey(buildCategoryValues(roi, colorFields));
    const color = colorByCategory.get(key);
    if (color) acc[id] = color;
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
