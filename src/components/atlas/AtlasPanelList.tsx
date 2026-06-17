import { type CSSProperties, memo } from "react";

import { AtlasGroupedList } from "./AtlasGroupedList";
import type { GroupTreeEntry } from "./panelTypes";

type ColumnSection = {
  key: string;
  entries: GroupTreeEntry[];
};

type AtlasPanelListProps = {
  groupedEntries: GroupTreeEntry[];
  columnSections: ColumnSection[];
  useColumns: boolean;
};

export const AtlasPanelList = memo(function AtlasPanelList({
  groupedEntries,
  columnSections,
  useColumns,
}: AtlasPanelListProps) {
  if (useColumns) {
    return (
      <div className="atlas-panel__columns-wrap">
        <div
          className="atlas-panel__columns"
          style={
            {
              "--atlas-column-count": String(columnSections.length),
            } as CSSProperties
          }
        >
          {columnSections.map((section) => (
            <AtlasGroupedList
              key={section.key}
              entries={section.entries}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AtlasGroupedList entries={groupedEntries} />
  );
});
