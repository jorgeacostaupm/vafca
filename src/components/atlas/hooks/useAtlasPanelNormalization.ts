import { useEffect } from "react";

import { DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS } from "@/config/ui";
import { useAppDispatch } from "@/store/hooks";
import { setAtlasColorFields } from "@/store/slices/atlasUi";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import type { AtlasPanelState } from "@/types/visualizationUi";

import { VIEWER_MIN_HEIGHT } from "../panelConstants";
import {
  areStringArraysEqual,
  areStringMapsEqual,
  normalizeUniqueFieldList,
} from "../panelFieldUtils";

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
    const normalizedGroupByFields = normalizeUniqueFieldList(
      atlasPanel.groupByFields,
      availableGroupFields,
    );
    const shouldApplyInitialDefaults =
      !atlasPanel.groupByFieldsInitialized &&
      atlasPanel.groupByFields.length === 0 &&
      availableGroupFields.length > 0;
    const nextGroupByFields = shouldApplyInitialDefaults
      ? [...DEFAULT_ATLAS_PANEL_GROUP_BY_FIELDS]
      : normalizedGroupByFields;
    const nextGroupByFieldsInitialized =
      atlasPanel.groupByFieldsInitialized ||
      availableGroupFields.length > 0 ||
      atlasPanel.groupByFields.length > 0;

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
    const initializedChanged =
      atlasPanel.groupByFieldsInitialized !== nextGroupByFieldsInitialized;
    if (
      !groupByChanged &&
      !filtersChanged &&
      !viewerHeightChanged &&
      !initializedChanged
    ) {
      return;
    }

    dispatch(
      setAtlasPanelState({
        groupByFields: nextGroupByFields,
        groupByFieldsInitialized: nextGroupByFieldsInitialized,
        selectedFilters: nextSelectedFilters,
        ...(groupByChanged || filtersChanged ? { collapsedGroups: [] } : {}),
        viewerHeight: normalizedViewerHeight,
      }),
    );
  }, [
    atlasPanel.groupByFields,
    atlasPanel.groupByFieldsInitialized,
    atlasPanel.selectedFilters,
    atlasPanel.viewerHeight,
    availableGroupFields,
    dispatch,
  ]);
};
