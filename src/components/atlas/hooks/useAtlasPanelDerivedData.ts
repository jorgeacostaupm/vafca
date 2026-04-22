import { useMemo } from "react";
import type { AtlasDefinition, AtlasState } from "@/types/atlas";
import type { AtlasPanelState } from "@/types/visualizationUi";
import {
  D3_CATEGORICAL_PALETTES,
  buildAtlasColorCategories,
} from "@/utils/atlas/coloring";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";
import type { GroupedRow } from "@/types/atlasPanel";
import type { AtlasColorCategoryItem } from "../AtlasPanelControls";
import { buildGroupRoiIdsByKey, buildGroupTreeEntries } from "../panelTree";

const MIN_COLOR_PREVIEW_ITEMS = 7;

type UseAtlasPanelDerivedDataArgs = {
  atlas: AtlasState;
  atlasPanel: AtlasPanelState;
  atlasDefinition: AtlasDefinition | null;
  availableGroupFields: string[];
  groupedRows: GroupedRow[];
};

export const useAtlasPanelDerivedData = ({
  atlas,
  atlasPanel,
  atlasDefinition,
  availableGroupFields,
  groupedRows,
}: UseAtlasPanelDerivedDataArgs) => {
  const groupedEntries = useMemo(() => buildGroupTreeEntries(groupedRows), [groupedRows]);

  const groupRoiIdsByKey = useMemo(
    () => buildGroupRoiIdsByKey(groupedEntries),
    [groupedEntries],
  );

  const selectableGroupFields = useMemo(
    () =>
      availableGroupFields.filter((field) => !atlasPanel.groupByFields.includes(field)),
    [availableGroupFields, atlasPanel.groupByFields],
  );

  const selectableColorFields = useMemo(
    () => availableGroupFields.filter((field) => !atlas.colorFields.includes(field)),
    [availableGroupFields, atlas.colorFields],
  );

  const columnSections = useMemo(() => {
    return groupedEntries.flatMap((entry) =>
      entry.type === "groupNode"
        ? [{ key: entry.row.groupKey, entries: [entry] }]
        : [],
    );
  }, [groupedEntries]);

  const useColumns = atlasPanel.groupByFields.length > 0 && columnSections.length > 0;

  const colorCategories = useMemo<AtlasColorCategoryItem[]>(() => {
    const enabledIds = new Set(
      atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false),
    );

    return buildAtlasColorCategories({
      atlasDefinition,
      colorFields: atlas.colorFields,
      colorPalette: atlas.colorPalette,
      includedIds: enabledIds,
    }).map((entry) => {
      const label = atlas.colorFields
        .map((field, index) => `${humanizeFieldName(field)}: ${entry.values[index]}`)
        .join(" · ");

      return {
        key: entry.key,
        label,
        count: entry.count,
        color: entry.color,
      };
    });
  }, [
    atlasDefinition,
    atlas.colorFields,
    atlas.colorPalette,
    atlas.order,
    atlas.labelsById,
  ]);

  const colorPreviewItems = useMemo<AtlasColorCategoryItem[]>(() => {
    if (colorCategories.length >= MIN_COLOR_PREVIEW_ITEMS) return colorCategories;

    const palette = D3_CATEGORICAL_PALETTES[atlas.colorPalette];
    const padded = [...colorCategories];
    for (let index = colorCategories.length; index < MIN_COLOR_PREVIEW_ITEMS; index += 1) {
      padded.push({
        key: `palette-slot-${index + 1}`,
        label: `Palette slot ${index + 1}`,
        count: 0,
        color: palette[index % palette.length],
      });
    }
    return padded;
  }, [atlas.colorPalette, colorCategories]);

  return {
    groupedEntries,
    groupRoiIdsByKey,
    selectableGroupFields,
    selectableColorFields,
    columnSections,
    useColumns,
    colorCategories,
    colorPreviewItems,
  };
};
