import {
  D3_GROUPING_PALETTES,
  type D3GroupingPaletteKey,
} from "@/config/groupingPalettes";
import type { AtlasDefinition, AtlasNode } from "@/types/atlas";
import { getNodeFieldValue, normalizeNodeFieldValue } from "@/utils/atlas/atlasDefinition";

type NodeGroupingColorCategory = {
  key: string;
  values: string[];
  count: number;
  nodeIds: string[];
  color: string;
};

const buildNodeGroupingValues = (node: AtlasNode, groupingFields: string[]) =>
  groupingFields.map((field) => normalizeNodeFieldValue(getNodeFieldValue(node, field)));

export const buildGroupingColorCategoryKey = (values: string[]) => JSON.stringify(values);

export const buildNodeGroupingColorCategories = ({
  atlasDefinition,
  groupingFields,
  colorPalette,
  includedIds,
}: {
  atlasDefinition: AtlasDefinition | null;
  groupingFields: string[];
  colorPalette: D3GroupingPaletteKey;
  includedIds?: Set<string>;
}): NodeGroupingColorCategory[] => {
  if (!atlasDefinition?.nodes?.length || groupingFields.length === 0) return [];

  const palette = D3_GROUPING_PALETTES[colorPalette].palette;
  const categories = new Map<string, { values: string[]; count: number; nodeIds: string[] }>();

  atlasDefinition.nodes.forEach((node) => {
    const id = String(node.id);
    if (includedIds && !includedIds.has(id)) return;

    const values = buildNodeGroupingValues(node, groupingFields);
    const key = buildGroupingColorCategoryKey(values);
    const current = categories.get(key);
    if (current) {
      current.count += 1;
      current.nodeIds.push(id);
      return;
    }
    categories.set(key, { values, count: 1, nodeIds: [id] });
  });

  return Array.from(categories.entries())
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: "base" }))
    .map(([key, entry], index) => ({
      key,
      values: entry.values,
      count: entry.count,
      nodeIds: entry.nodeIds,
      color: palette[index % palette.length],
    }));
};

export const buildNodeGroupingColorById = ({
  atlasDefinition,
  groupingFields,
  colorPalette,
}: {
  atlasDefinition: AtlasDefinition | null;
  groupingFields: string[];
  colorPalette: D3GroupingPaletteKey;
}) => {
  if (!atlasDefinition?.nodes?.length) {
    return {} as Record<string, string>;
  }
  const palette = D3_GROUPING_PALETTES[colorPalette].palette;
  const fallbackColor = palette[0] ?? "#4e79a7";
  if (groupingFields.length === 0) {
    return atlasDefinition.nodes.reduce<Record<string, string>>((acc, node) => {
      acc[String(node.id)] = fallbackColor;
      acc[String(node.atlasId)] = fallbackColor;
      return acc;
    }, {});
  }

  const categories = buildNodeGroupingColorCategories({
    atlasDefinition,
    groupingFields,
    colorPalette,
  });
  const colorByCategory = new Map(categories.map((entry) => [entry.key, entry.color]));

  return atlasDefinition.nodes.reduce<Record<string, string>>((acc, node) => {
    const id = String(node.id);
    const key = buildGroupingColorCategoryKey(
      buildNodeGroupingValues(node, groupingFields),
    );
    const color = colorByCategory.get(key);
    if (color) {
      acc[id] = color;
      acc[String(node.atlasId)] = color;
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
