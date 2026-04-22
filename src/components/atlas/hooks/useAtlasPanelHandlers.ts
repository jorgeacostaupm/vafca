import { useCallback } from "react";
import type { Key } from "react";
import type { AtlasState, D3CategoricalPaletteKey } from "@/types/atlas";
import type { AtlasPanelState } from "@/types/visualizationUi";
import type { AppDispatch } from "@/types/store";
import {
  setAllLabels,
  setAtlasColorFields,
  setAtlasColorPalette,
  setLabelEnabled,
  setLabelsEnabled,
} from "@/store/slices/atlas";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { moveField } from "../panelFieldUtils";

type UseAtlasPanelHandlersArgs = {
  dispatch: AppDispatch;
  atlas: AtlasState;
  atlasPanel: AtlasPanelState;
  groupRoiIdsByKey: Record<string, string[]>;
};

export const useAtlasPanelHandlers = ({
  dispatch,
  atlas,
  atlasPanel,
  groupRoiIdsByKey,
}: UseAtlasPanelHandlersArgs) => {
  const handleToggleLabel = useCallback(
    (id: string, enabled: boolean) => {
      dispatch(setLabelEnabled({ id, enabled }));
    },
    [dispatch],
  );

  const updateCollapsedGroups = useCallback(
    (groupKeys: string[], activeKeys: Key | Key[]) => {
      const expanded = new Set(
        (Array.isArray(activeKeys) ? activeKeys : [activeKeys])
          .filter((key): key is Key => key !== undefined && key !== null)
          .map((key) => String(key)),
      );

      const nextCollapsed = new Set(atlasPanel.collapsedGroups);
      groupKeys.forEach((key) => {
        if (expanded.has(key)) {
          nextCollapsed.delete(key);
        } else {
          nextCollapsed.add(key);
        }
      });

      dispatch(setAtlasPanelState({ collapsedGroups: Array.from(nextCollapsed) }));
    },
    [atlasPanel.collapsedGroups, dispatch],
  );

  const setGroupEnabled = useCallback(
    (groupKey: string, enabled: boolean) => {
      const ids = groupRoiIdsByKey[groupKey] ?? [];
      if (ids.length === 0) return;
      dispatch(setLabelsEnabled({ ids, enabled }));
    },
    [dispatch, groupRoiIdsByKey],
  );

  const handleMoveGroupField = useCallback(
    (field: string, direction: "up" | "down") => {
      dispatch(
        setAtlasPanelState({
          groupByFields: moveField(atlasPanel.groupByFields, field, direction),
          collapsedGroups: [],
        }),
      );
    },
    [atlasPanel.groupByFields, dispatch],
  );

  const handleRemoveGroupField = useCallback(
    (field: string) => {
      const nextGroupByFields = atlasPanel.groupByFields.filter((value) => value !== field);
      const nextSelectedFilters = { ...atlasPanel.selectedFilters };
      delete nextSelectedFilters[field];

      dispatch(
        setAtlasPanelState({
          groupByFields: nextGroupByFields,
          selectedFilters: nextSelectedFilters,
          collapsedGroups: [],
        }),
      );
    },
    [atlasPanel.groupByFields, atlasPanel.selectedFilters, dispatch],
  );

  const handleAddGroupField = useCallback(
    (field: string) => {
      dispatch(
        setAtlasPanelState({
          groupByFields: [...atlasPanel.groupByFields, field],
          collapsedGroups: [],
        }),
      );
    },
    [atlasPanel.groupByFields, dispatch],
  );

  const handleMoveColorField = useCallback(
    (field: string, direction: "up" | "down") => {
      dispatch(setAtlasColorFields(moveField(atlas.colorFields, field, direction)));
    },
    [atlas.colorFields, dispatch],
  );

  const handleRemoveColorField = useCallback(
    (field: string) => {
      dispatch(setAtlasColorFields(atlas.colorFields.filter((value) => value !== field)));
    },
    [atlas.colorFields, dispatch],
  );

  const handleAddColorField = useCallback(
    (field: string) => {
      dispatch(setAtlasColorFields([...atlas.colorFields, field]));
    },
    [atlas.colorFields, dispatch],
  );

  const handleSetColorPalette = useCallback(
    (value: D3CategoricalPaletteKey) => {
      dispatch(setAtlasColorPalette(value));
    },
    [dispatch],
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      dispatch(setAtlasPanelState({ query }));
    },
    [dispatch],
  );

  const handleFilterChange = useCallback(
    (field: string, value: string) => {
      dispatch(
        setAtlasPanelState({
          selectedFilters: {
            ...atlasPanel.selectedFilters,
            [field]: value,
          },
          collapsedGroups: [],
        }),
      );
    },
    [atlasPanel.selectedFilters, dispatch],
  );

  const handleSelectAll = useCallback(() => {
    dispatch(setAllLabels(true));
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(setAllLabels(false));
  }, [dispatch]);

  return {
    handleToggleLabel,
    updateCollapsedGroups,
    setGroupEnabled,
    handleMoveGroupField,
    handleRemoveGroupField,
    handleAddGroupField,
    handleMoveColorField,
    handleRemoveColorField,
    handleAddColorField,
    handleSetColorPalette,
    handleQueryChange,
    handleFilterChange,
    handleSelectAll,
    handleClearAll,
  };
};
