import { useMemo } from "react";

import type { AtlasDefinition } from "@/types/atlas";

import {
  buildGroupedRows,
  buildNodeFieldValuesById,
  filterIds,
} from "./panelDataUtils";

export const useAtlasPanelData = ({
  orderedIds,
  labelSearchTextById,
  atlasDefinition,
  query,
  groupByFields,
  collapsedGroups,
  enabledCount,
}: {
  orderedIds: string[];
  labelSearchTextById: Record<string, string>;
  atlasDefinition: AtlasDefinition | null;
  query: string;
  groupByFields: string[];
  collapsedGroups: Set<string>;
  enabledCount: number;
}) => {
  const normalizedQuery = query.trim().toLowerCase();

  const nodeFieldValuesById = useMemo(
    () => buildNodeFieldValuesById(atlasDefinition, groupByFields),
    [atlasDefinition, groupByFields],
  );

  const filteredIds = useMemo(
    () =>
      filterIds({
        orderedIds,
        labelSearchTextById,
        normalizedQuery,
      }),
    [
      orderedIds,
      labelSearchTextById,
      normalizedQuery,
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
    groupedRows,
    totalCount,
    enabledCount,
    allEnabled,
    allDisabled,
  };
};
