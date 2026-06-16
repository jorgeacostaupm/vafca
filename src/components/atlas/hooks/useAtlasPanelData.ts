import { useMemo } from "react";

import type { AtlasDefinition } from "@/types/atlas";

import {
  buildFieldOptionsByField,
  buildGroupedRows,
  buildNodeFieldValuesById,
  filterIds,
} from "./panelDataUtils";

export const toggleSetValue = (values: Set<string>, value: string) => {
  const next = new Set(values);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

export const useAtlasPanelData = ({
  orderedIds,
  labelSearchTextById,
  atlasDefinition,
  query,
  groupByFields,
  selectedFilters,
  collapsedGroups,
  enabledCount,
}: {
  orderedIds: string[];
  labelSearchTextById: Record<string, string>;
  atlasDefinition: AtlasDefinition | null;
  query: string;
  groupByFields: string[];
  selectedFilters: Record<string, string>;
  collapsedGroups: Set<string>;
  enabledCount: number;
}) => {
  const normalizedQuery = query.trim().toLowerCase();

  const nodeFieldValuesById = useMemo(
    () => buildNodeFieldValuesById(atlasDefinition, groupByFields),
    [atlasDefinition, groupByFields],
  );

  const fieldOptionsByField = useMemo(
    () =>
      buildFieldOptionsByField({
        groupByFields,
        orderedIds,
        labelSearchTextById,
        nodeFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      groupByFields,
      orderedIds,
      labelSearchTextById,
      nodeFieldValuesById,
      normalizedQuery,
      selectedFilters,
    ],
  );

  const filteredIds = useMemo(
    () =>
      filterIds({
        orderedIds,
        labelSearchTextById,
        nodeFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      orderedIds,
      labelSearchTextById,
      nodeFieldValuesById,
      normalizedQuery,
      selectedFilters,
    ],
  );

  const groupedRows = useMemo(
    () =>
      buildGroupedRows({
        filteredIds,
        groupByFields,
        nodeFieldValuesById,
        collapsedGroups,
      }),
    [filteredIds, groupByFields, nodeFieldValuesById, collapsedGroups],
  );

  const totalCount = orderedIds.length;
  const allEnabled = totalCount > 0 && enabledCount === totalCount;
  const allDisabled = totalCount > 0 && enabledCount === 0;

  return {
    fieldOptionsByField,
    groupedRows,
    totalCount,
    enabledCount,
    allEnabled,
    allDisabled,
  };
};
