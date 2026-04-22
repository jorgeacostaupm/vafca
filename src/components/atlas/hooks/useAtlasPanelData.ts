import { useMemo } from "react";
import type { AtlasDefinition, AtlasState } from "@/types/atlas";
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
  atlas,
  atlasDefinition,
  query,
  groupByFields,
  selectedFilters,
  collapsedGroups,
}: {
  atlas: AtlasState;
  atlasDefinition: AtlasDefinition | null;
  query: string;
  groupByFields: string[];
  selectedFilters: Record<string, string>;
  collapsedGroups: Set<string>;
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
        orderedIds: atlas.order,
        labelsById: atlas.labelsById,
        roiFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      groupByFields,
      atlas.order,
      atlas.labelsById,
      roiFieldValuesById,
      normalizedQuery,
      selectedFilters,
    ],
  );

  const filteredIds = useMemo(
    () =>
      filterIds({
        orderedIds: atlas.order,
        labelsById: atlas.labelsById,
        roiFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      atlas.order,
      atlas.labelsById,
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

  const totalCount = atlas.order.length;
  const enabledCount = useMemo(
    () =>
      atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false).length,
    [atlas.order, atlas.labelsById],
  );
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
