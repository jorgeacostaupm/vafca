import { useEffect } from "react";
import type { AtlasState } from "@/types/atlas";
import type { AtlasPanelState } from "@/types/visualizationUi";
import type { AppDispatch } from "@/types/store";
import { setAtlasColorFields } from "@/store/slices/atlas";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { getDefaultGroupByFields } from "@/utils/atlas/atlasDefinition";
import {
  areStringArraysEqual,
  areStringMapsEqual,
  normalizeUniqueFieldList,
} from "../panelFieldUtils";
import { VIEWER_MIN_HEIGHT } from "../panelConstants";

type UseAtlasPanelNormalizationArgs = {
  dispatch: AppDispatch;
  atlas: AtlasState;
  atlasPanel: AtlasPanelState;
  availableGroupFields: string[];
};

export const useAtlasPanelNormalization = ({
  dispatch,
  atlas,
  atlasPanel,
  availableGroupFields,
}: UseAtlasPanelNormalizationArgs) => {
  useEffect(() => {
    const validColorFields = atlas.colorFields.filter((field) =>
      availableGroupFields.includes(field),
    );
    if (validColorFields.length !== atlas.colorFields.length) {
      dispatch(setAtlasColorFields(validColorFields));
    }
  }, [availableGroupFields, atlas.colorFields, dispatch]);

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
