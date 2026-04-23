import type { AtlasDefinition } from "@/types/atlas";
import type { GroupedRow } from "@/types/atlasPanel";
import {
  UNKNOWN_GROUP,
  normalizeRoiFieldValue,
} from "@/utils/atlas/atlasDefinition";
import { ALL_FILTER } from "../panelConstants";

export type SelectOption = { value: string; label: string };

const orderGroupValues = (values: string[]) => {
  return [...values].sort((a, b) => {
    const pa = a === UNKNOWN_GROUP ? 1 : 0;
    const pb = b === UNKNOWN_GROUP ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
};

const formatGroupValue = (value: string) =>
  value === UNKNOWN_GROUP ? "Unknown" : value;

export const buildRoiFieldValuesById = (
  atlasDefinition: AtlasDefinition | null,
  fields: string[],
) => {
  const map = new Map<string, Record<string, string>>();
  if (!atlasDefinition?.rois?.length || fields.length === 0) return map;

  atlasDefinition.rois.forEach((roi) => {
    const id = String(roi.id);
    const values = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field] = normalizeRoiFieldValue(roi[field]);
      return acc;
    }, {});
    map.set(id, values);
  });

  return map;
};

const matchesQuery = (
  id: string,
  labelSearchTextById: Record<string, string>,
  normalizedQuery: string,
) => {
  if (!normalizedQuery) return true;
  return (labelSearchTextById[id] ?? id.toLowerCase()).includes(normalizedQuery);
};

const matchesFilters = (
  id: string,
  roiFieldValuesById: Map<string, Record<string, string>>,
  selectedFilters: Record<string, string>,
  ignoredField?: string,
) => {
  for (const [field, selected] of Object.entries(selectedFilters)) {
    if (field === ignoredField || selected === ALL_FILTER) continue;
    const value = roiFieldValuesById.get(id)?.[field] ?? UNKNOWN_GROUP;
    if (value !== selected) return false;
  }
  return true;
};

export const filterIds = ({
  orderedIds,
  labelSearchTextById,
  roiFieldValuesById,
  normalizedQuery,
  selectedFilters,
}: {
  orderedIds: string[];
  labelSearchTextById: Record<string, string>;
  roiFieldValuesById: Map<string, Record<string, string>>;
  normalizedQuery: string;
  selectedFilters: Record<string, string>;
}) => {
  if (!normalizedQuery && Object.keys(selectedFilters).length === 0) {
    return orderedIds;
  }

  return orderedIds.filter((id) => {
    if (!matchesQuery(id, labelSearchTextById, normalizedQuery)) return false;
    return matchesFilters(id, roiFieldValuesById, selectedFilters);
  });
};

export const buildFieldOptionsByField = ({
  groupByFields,
  orderedIds,
  labelSearchTextById,
  roiFieldValuesById,
  normalizedQuery,
  selectedFilters,
}: {
  groupByFields: string[];
  orderedIds: string[];
  labelSearchTextById: Record<string, string>;
  roiFieldValuesById: Map<string, Record<string, string>>;
  normalizedQuery: string;
  selectedFilters: Record<string, string>;
}) => {
  const entries = groupByFields.map((field) => {
    const values = new Set<string>();
    orderedIds.forEach((id) => {
      if (!matchesQuery(id, labelSearchTextById, normalizedQuery)) return;
      if (!matchesFilters(id, roiFieldValuesById, selectedFilters, field)) return;
      values.add(roiFieldValuesById.get(id)?.[field] ?? UNKNOWN_GROUP);
    });

    const options: SelectOption[] = [
      { value: ALL_FILTER, label: "All" },
      ...orderGroupValues(Array.from(values)).map((value) => ({
        value,
        label: formatGroupValue(value),
      })),
    ];

    return [field, options] as const;
  });

  return Object.fromEntries(entries) as Record<string, SelectOption[]>;
};

export const buildGroupedRows = ({
  filteredIds,
  groupByFields,
  roiFieldValuesById,
  collapsedGroups,
}: {
  filteredIds: string[];
  groupByFields: string[];
  roiFieldValuesById: Map<string, Record<string, string>>;
  collapsedGroups: Set<string>;
}) => {
  if (filteredIds.length === 0) return [];

  if (groupByFields.length === 0) {
    return filteredIds.map((id) => ({
      type: "roi" as const,
      key: `roi-${id}`,
      id,
      level: 0,
    }));
  }

  const buildRows = (
    ids: string[],
    level: number,
    fieldIndex: number,
    pathParts: string[],
  ): GroupedRow[] => {
    if (fieldIndex >= groupByFields.length) {
      return ids.map((id) => ({
        type: "roi" as const,
        key: `roi-${id}`,
        id,
        level,
      }));
    }

    const field = groupByFields[fieldIndex];
    const groups = new Map<string, string[]>();

    ids.forEach((id) => {
      const value = roiFieldValuesById.get(id)?.[field] ?? UNKNOWN_GROUP;
      if (!groups.has(value)) {
        groups.set(value, []);
      }
      groups.get(value)?.push(id);
    });

    const rows: GroupedRow[] = [];
    const orderedValues = orderGroupValues(Array.from(groups.keys()));
    orderedValues.forEach((value) => {
      const groupIds = groups.get(value);
      if (!groupIds || groupIds.length === 0) return;

      const nextPath = [...pathParts, `${field}=${value}`];
      const groupKey = nextPath.join("|");
      rows.push({
        type: "group",
        key: `group|${groupKey}`,
        level,
        title: formatGroupValue(value),
        groupKey,
        count: groupIds.length,
      });

      if (collapsedGroups.has(groupKey)) return;
      rows.push(...buildRows(groupIds, level + 1, fieldIndex + 1, nextPath));
    });

    return rows;
  };

  return buildRows(filteredIds, 0, 0, []);
};
