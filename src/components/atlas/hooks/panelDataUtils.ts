import type { AtlasDefinition } from "@/types/atlas";
import type { GroupedRow } from "@/types/atlasPanel";
import {
  getNodeFieldValue,
  normalizeNodeFieldValue,
  UNKNOWN_GROUP,
} from "@/utils/atlas/atlasDefinition";

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

export const buildNodeFieldValuesById = (
  atlasDefinition: AtlasDefinition | null,
  fields: string[],
) => {
  const map = new Map<string, Record<string, string>>();
  if (!atlasDefinition?.nodes?.length || fields.length === 0) return map;

  atlasDefinition.nodes.forEach((node) => {
    const id = String(node.id);
    const values = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field] = normalizeNodeFieldValue(getNodeFieldValue(node, field));
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

export const filterIds = ({
  orderedIds,
  labelSearchTextById,
  normalizedQuery,
}: {
  orderedIds: string[];
  labelSearchTextById: Record<string, string>;
  normalizedQuery: string;
}) => {
  if (!normalizedQuery) return orderedIds;

  return orderedIds.filter((id) =>
    matchesQuery(id, labelSearchTextById, normalizedQuery),
  );
};

export const buildGroupedRows = ({
  filteredIds,
  groupByFields,
  nodeFieldValuesById,
  collapsedGroups,
}: {
  filteredIds: string[];
  groupByFields: string[];
  nodeFieldValuesById: Map<string, Record<string, string>>;
  collapsedGroups: Set<string>;
}) => {
  if (filteredIds.length === 0) return [];

  if (groupByFields.length === 0) {
    return filteredIds.map((id) => ({
      type: "node" as const,
      key: `node-${id}`,
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
        type: "node" as const,
        key: `node-${id}`,
        id,
        level,
      }));
    }

    const field = groupByFields[fieldIndex];
    const groups = new Map<string, string[]>();

    ids.forEach((id) => {
      const value = nodeFieldValuesById.get(id)?.[field] ?? UNKNOWN_GROUP;
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
