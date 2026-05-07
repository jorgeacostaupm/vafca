import { useMemo } from "react";
import type { AtlasPanelState } from "@/types/visualizationUi";
import type { GroupedRow } from "@/types/atlasPanel";
import { buildGroupTreeEntries } from "../panelTree";

type UseAtlasPanelDerivedDataArgs = {
  atlasPanel: AtlasPanelState;
  availableGroupFields: string[];
  groupedRows: GroupedRow[];
};

export const useAtlasPanelDerivedData = ({
  atlasPanel,
  availableGroupFields,
  groupedRows,
}: UseAtlasPanelDerivedDataArgs) => {
  const groupedEntries = useMemo(() => buildGroupTreeEntries(groupedRows), [groupedRows]);

  const selectableGroupFields = useMemo(
    () =>
      availableGroupFields.filter((field) => !atlasPanel.groupByFields.includes(field)),
    [availableGroupFields, atlasPanel.groupByFields],
  );

  const columnSections = useMemo(() => {
    return groupedEntries.flatMap((entry) =>
      entry.type === "groupNode"
        ? [{ key: entry.row.groupKey, entries: [entry] }]
        : [],
    );
  }, [groupedEntries]);

  const useColumns = atlasPanel.groupByFields.length > 0 && columnSections.length > 0;

  return {
    groupedEntries,
    selectableGroupFields,
    columnSections,
    useColumns,
  };
};
