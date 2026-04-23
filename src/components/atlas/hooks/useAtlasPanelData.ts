import { useMemo } from "react";
import type { AtlasDefinition } from "@/types/atlas";
import {
  buildFieldOptionsByField,
  buildGroupedRows,
  buildRoiFieldValuesById,
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

  const roiFieldValuesById = useMemo(
    () => buildRoiFieldValuesById(atlasDefinition, groupByFields),
    [atlasDefinition, groupByFields],
  );

  const fieldOptionsByField = useMemo(
    () =>
      buildFieldOptionsByField({
        groupByFields,
        orderedIds,
        labelSearchTextById,
        roiFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      groupByFields,
      orderedIds,
      labelSearchTextById,
      roiFieldValuesById,
      normalizedQuery,
      selectedFilters,
    ],
  );

  const filteredIds = useMemo(
    () =>
      filterIds({
        orderedIds,
        labelSearchTextById,
        roiFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      orderedIds,
      labelSearchTextById,
      roiFieldValuesById,
      normalizedQuery,
      selectedFilters,
    ],
  );

  const groupedRows = useMemo(
    () =>
      buildGroupedRows({
        filteredIds,
        groupByFields,
        roiFieldValuesById,
        collapsedGroups,
      }),
    [filteredIds, groupByFields, roiFieldValuesById, collapsedGroups],
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
