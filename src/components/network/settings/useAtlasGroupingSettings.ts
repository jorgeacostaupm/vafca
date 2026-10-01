import { useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";

import {
  D3_GROUPING_PALETTES,
  type D3GroupingPaletteKey,
} from "@/config/groupingPalettes";
import { MIN_GROUPING_COLOR_PREVIEW_ITEMS } from "@/config/ui";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAtlasColorFields,
  selectAtlasColorPalette,
  selectAtlasEnabledIds,
  setAtlasColorFields,
} from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import type { AtlasColorCategoryItem } from "@/types/atlasPanel";
import { getCommonNodeFields } from "@/utils/atlas/atlasDefinition";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";
import { buildNodeGroupingColorCategories } from "@/utils/groupingColoring";

type AtlasGroupingSettingsOptions = {
  previewColorFields?: string[];
  previewColorPalette?: D3GroupingPaletteKey;
};

export const useAtlasGroupingSettings = ({
  previewColorFields,
  previewColorPalette,
}: AtlasGroupingSettingsOptions = {}) => {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const colorFields = useAppSelector(selectAtlasColorFields);
  const colorPalette = useAppSelector(selectAtlasColorPalette);
  const enabledIds = useAppSelector(selectAtlasEnabledIds, shallowEqual);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));

  const availableFields = useMemo(
    () => getCommonNodeFields(atlasDefinition),
    [atlasDefinition],
  );

  const effectiveColorFields = previewColorFields ?? colorFields;
  const effectiveColorPalette = previewColorPalette ?? colorPalette;

  const selectableColorFields = useMemo(
    () => availableFields.filter((field) => !effectiveColorFields.includes(field)),
    [availableFields, effectiveColorFields],
  );

  useEffect(() => {
    const validColorFields = colorFields.filter((field) =>
      availableFields.includes(field),
    );
    if (validColorFields.length !== colorFields.length) {
      dispatch(setAtlasColorFields(validColorFields));
    }
  }, [availableFields, colorFields, dispatch]);

  const colorCategories = useMemo<AtlasColorCategoryItem[]>(() => {
    const includedIds = new Set(enabledIds);

    const allCategories = buildNodeGroupingColorCategories({ atlasDefinition, groupingFields: effectiveColorFields, colorPalette: effectiveColorPalette });
    const colorByKey = new Map(allCategories.map(category => [category.key, category.color]));
    return buildNodeGroupingColorCategories({
      atlasDefinition,
      groupingFields: effectiveColorFields,
      colorPalette: effectiveColorPalette,
      includedIds,
    }).map((entry) => ({
      key: entry.key,
      label: entry.values.join(" · "),
      count: entry.count,
      color: colorByKey.get(entry.key) ?? entry.color,
    }));
  }, [atlasDefinition, effectiveColorFields, effectiveColorPalette, enabledIds]);

  const colorPreviewItems = useMemo<AtlasColorCategoryItem[]>(() => {
    if (colorCategories.length >= MIN_GROUPING_COLOR_PREVIEW_ITEMS) {
      return colorCategories;
    }

    const palette = D3_GROUPING_PALETTES[effectiveColorPalette].palette;
    const padded = [...colorCategories];
    for (
      let index = colorCategories.length;
      index < MIN_GROUPING_COLOR_PREVIEW_ITEMS;
      index += 1
    ) {
      padded.push({
        key: `palette-slot-${index + 1}`,
        label: `Palette slot ${index + 1}`,
        count: 0,
        color: palette[index % palette.length],
      });
    }
    return padded;
  }, [colorCategories, effectiveColorPalette]);

  return {
    colorFields,
    colorPalette,
    selectableColorFields,
    colorCategories,
    colorPreviewItems,
  };
};
