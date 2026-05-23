import { useEffect, useMemo } from "react";
import { shallowEqual } from "react-redux";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAtlasColorFields,
  selectAtlasColorPalette,
  selectAtlasEnabledIds,
  setAtlasColorFields,
} from "@/store/slices/atlas";
import type { AtlasColorCategoryItem } from "@/types/atlasPanel";
import { D3_GROUPING_PALETTES } from "@/config/groupingPalettes";
import { buildRoiGroupingColorCategories } from "@/utils/groupingColoring";
import { getCommonRoiFields, humanizeFieldName } from "@/utils/atlas/atlasDefinition";

const MIN_COLOR_PREVIEW_ITEMS = 7;

export const useAtlasGroupingSettings = () => {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const colorFields = useAppSelector(selectAtlasColorFields);
  const colorPalette = useAppSelector(selectAtlasColorPalette);
  const enabledIds = useAppSelector(selectAtlasEnabledIds, shallowEqual);
  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );

  const availableFields = useMemo(
    () => getCommonRoiFields(atlasDefinition),
    [atlasDefinition],
  );

  const selectableColorFields = useMemo(
    () => availableFields.filter((field) => !colorFields.includes(field)),
    [availableFields, colorFields],
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

    return buildRoiGroupingColorCategories({
      atlasDefinition,
      groupingFields: colorFields,
      colorPalette,
      includedIds,
    }).map((entry) => ({
      key: entry.key,
      label: colorFields
        .map((field, index) => `${humanizeFieldName(field)}: ${entry.values[index]}`)
        .join(" · "),
      count: entry.count,
      color: entry.color,
    }));
  }, [atlasDefinition, colorFields, colorPalette, enabledIds]);

  const colorPreviewItems = useMemo<AtlasColorCategoryItem[]>(() => {
    if (colorCategories.length >= MIN_COLOR_PREVIEW_ITEMS) return colorCategories;

    const palette = D3_GROUPING_PALETTES[colorPalette].palette;
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
  }, [colorCategories, colorPalette]);

  return {
    colorFields,
    colorPalette,
    selectableColorFields,
    colorCategories,
    colorPreviewItems,
  };
};
