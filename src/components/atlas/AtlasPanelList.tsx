import { Fragment, type CSSProperties, type Key } from "react";
import type { AtlasState } from "@/types/atlas";
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
  collapsedGroups: Set<string>;
  labelsById: AtlasState["labelsById"];
  onToggleLabel: (id: string, enabled: boolean) => void;
  onUpdateCollapsedGroups: (groupKeys: string[], activeKeys: Key | Key[]) => void;
  onSetGroupEnabled: (groupKey: string, enabled: boolean) => void;
};

export function AtlasPanelList({
  groupedEntries,
  columnSections,
  useColumns,
  collapsedGroups,
  labelsById,
  onToggleLabel,
  onUpdateCollapsedGroups,
  onSetGroupEnabled,
}: AtlasPanelListProps) {
  if (useColumns) {
    return (
      <div className="atlas-panel__columns-wrap">
        <div
          className="atlas-panel__columns"
          style={{ "--atlas-column-count": String(columnSections.length) } as CSSProperties}
        >
          {columnSections.map((section) => (
            <Fragment key={section.key}>
              <AtlasGroupedList
                entries={section.entries}
                collapsedGroups={collapsedGroups}
                labelsById={labelsById}
                onToggleLabel={onToggleLabel}
                onUpdateCollapsedGroups={onUpdateCollapsedGroups}
                onSetGroupEnabled={onSetGroupEnabled}
              />
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <AtlasGroupedList
      entries={groupedEntries}
      collapsedGroups={collapsedGroups}
      labelsById={labelsById}
      onToggleLabel={onToggleLabel}
      onUpdateCollapsedGroups={onUpdateCollapsedGroups}
      onSetGroupEnabled={onSetGroupEnabled}
    />
  );
}
