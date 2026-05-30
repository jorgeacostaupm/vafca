import { useEffect } from "react";
import type { AtlasPanelState } from "@/types/visualizationUi";
import { setAtlasColorFields } from "@/store/slices/atlasUi";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { useAppDispatch } from "@/store/hooks";
import { getDefaultGroupByFields } from "@/utils/atlas/atlasDefinition";
import {
  areStringArraysEqual,
  areStringMapsEqual,
  normalizeUniqueFieldList,
} from "../panelFieldUtils";
import { VIEWER_MIN_HEIGHT } from "../panelConstants";

type UseAtlasPanelNormalizationArgs = {
  colorFields: string[];
  atlasPanel: AtlasPanelState;
  availableGroupFields: string[];
};

export const useAtlasPanelNormalization = ({
  colorFields,
  atlasPanel,
  availableGroupFields,
}: UseAtlasPanelNormalizationArgs) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const validColorFields = colorFields.filter((field) =>
      availableGroupFields.includes(field),
    );
    if (validColorFields.length !== colorFields.length) {
      dispatch(setAtlasColorFields(validColorFields));
    }
  }, [availableGroupFields, colorFields, dispatch]);

  useEffect(() => {
    const defaults = getDefaultGroupByFields(availableGroupFields);
    const nextGroupByFields =
      atlasPanel.groupByFields.length > 0
        ? normalizeUniqueFieldList(atlasPanel.groupByFields, availableGroupFields)
        : defaults;

    const nextSelectedFilters = Object.fromEntries(
      Object.entries(atlasPanel.selectedFilters).filter(([field]) =>
        nextGroupByFields.includes(field),
      ),
    );

    const normalizedViewerHeight = Math.max(
      VIEWER_MIN_HEIGHT,
      atlasPanel.viewerHeight,
    );

    const groupByChanged = !areStringArraysEqual(
      nextGroupByFields,
      atlasPanel.groupByFields,
    );
    const filtersChanged = !areStringMapsEqual(
      nextSelectedFilters,
      atlasPanel.selectedFilters,
    );
    const viewerHeightChanged = atlasPanel.viewerHeight !== normalizedViewerHeight;
    if (!groupByChanged && !filtersChanged && !viewerHeightChanged) return;

    dispatch(
      setAtlasPanelState({
        groupByFields: nextGroupByFields,
        selectedFilters: nextSelectedFilters,
        ...(groupByChanged || filtersChanged ? { collapsedGroups: [] } : {}),
        viewerHeight: normalizedViewerHeight,
      }),
    );
  }, [
    atlasPanel.groupByFields,
    atlasPanel.selectedFilters,
    atlasPanel.viewerHeight,
    availableGroupFields,
    dispatch,
  ]);
};
