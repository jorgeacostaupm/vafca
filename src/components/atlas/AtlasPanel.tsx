import { useCallback, useMemo, useRef, type PointerEvent } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import {
  atlasSupports3d,
  getCommonRoiFields,
} from "@/utils/atlas/atlasDefinition";
import { useAtlasPanelData, useAtlasScene } from "./atlasPanelHooks";
import { VIEWER_MIN_HEIGHT } from "./panelConstants";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { AtlasPanelLayout } from "./AtlasPanelLayout";
import { useAtlasPanelNormalization } from "./hooks/useAtlasPanelNormalization";
import { useAtlasPanelDerivedData } from "./hooks/useAtlasPanelDerivedData";
import { useAtlasPanelHandlers } from "./hooks/useAtlasPanelHandlers";

export default function AtlasPanel() {
  const dispatch = useAppDispatch();
  const atlas = useAppSelector((state) => state.atlas);
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlasPanel = useAppSelector((state) => state.visualizationUi.atlasPanel);
  const uploadedAtlasSource = useAppSelector((state) => state.atlasDefinition.uploaded);

  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );

  const availableGroupFields = useMemo(
    () => getCommonRoiFields(atlasDefinition),
    [atlasDefinition],
  );

  const has3d = useMemo(
    () => atlasSupports3d(atlasDefinition, uploadedAtlasSource?.meshMode),
    [atlasDefinition, uploadedAtlasSource?.meshMode],
  );

  const collapsedGroups = useMemo(
    () => new Set(atlasPanel.collapsedGroups),
    [atlasPanel.collapsedGroups],
  );

  useAtlasPanelNormalization({
    dispatch,
    atlas,
    atlasPanel,
    availableGroupFields,
  });

  const {
    fieldOptionsByField,
    groupedRows,
    totalCount,
    enabledCount,
    allEnabled,
    allDisabled,
  } = useAtlasPanelData({
    atlas,
    atlasDefinition,
    query: atlasPanel.query,
    groupByFields: atlasPanel.groupByFields,
    selectedFilters: atlasPanel.selectedFilters,
    collapsedGroups: new Set<string>(),
  });

  const {
    groupedEntries,
    groupRoiIdsByKey,
    selectableGroupFields,
    selectableColorFields,
    columnSections,
    useColumns,
    colorCategories,
    colorPreviewItems,
  } = useAtlasPanelDerivedData({
    atlas,
    atlasPanel,
    atlasDefinition,
    availableGroupFields,
    groupedRows,
  });

  const {
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
  } = useAtlasPanelHandlers({
    dispatch,
    atlas,
    atlasPanel,
    groupRoiIdsByKey,
  });

  const { applyCameraPose } = useAtlasScene({
    atlasDefinition,
    atlas,
    containerRef,
    onToggle: handleToggleLabel,
    enable3d: has3d,
  });

  const handleResizePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeStateRef.current = {
        startY: event.clientY,
        startHeight: atlasPanel.viewerHeight,
      };
    },
    [atlasPanel.viewerHeight],
  );

  const handleResizePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;
      const delta = event.clientY - resizeState.startY;
      const nextHeight = Math.max(VIEWER_MIN_HEIGHT, resizeState.startHeight + delta);
      dispatch(setAtlasPanelState({ viewerHeight: nextHeight }));
    },
    [dispatch],
  );

  const handleResizePointerEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  return (
    <AtlasPanelLayout
      has3d={has3d}
      controlsProps={{
        totalCount,
        enabledCount,
        groupByFields: atlasPanel.groupByFields,
        selectableGroupFields,
        colorFields: atlas.colorFields,
        selectableColorFields,
        colorPalette: atlas.colorPalette,
        colorCategories,
        colorPreviewItems,
        onMoveGroupField: handleMoveGroupField,
        onRemoveGroupField: handleRemoveGroupField,
        onAddGroupField: handleAddGroupField,
        onMoveColorField: handleMoveColorField,
        onRemoveColorField: handleRemoveColorField,
        onAddColorField: handleAddColorField,
        onSetColorPalette: handleSetColorPalette,
      }}
      filtersProps={{
        query: atlasPanel.query,
        groupByFields: atlasPanel.groupByFields,
        selectedFilters: atlasPanel.selectedFilters,
        fieldOptionsByField,
        totalCount,
        allEnabled,
        allDisabled,
        onQueryChange: handleQueryChange,
        onFilterChange: handleFilterChange,
        onSelectAll: handleSelectAll,
        onClearAll: handleClearAll,
      }}
      listProps={{
        groupedEntries,
        columnSections,
        useColumns,
        collapsedGroups,
        labelsById: atlas.labelsById,
        onToggleLabel: handleToggleLabel,
        onUpdateCollapsedGroups: updateCollapsedGroups,
        onSetGroupEnabled: setGroupEnabled,
      }}
      viewerProps={{
        containerRef,
        viewerHeight: atlasPanel.viewerHeight,
        onResizePointerDown: handleResizePointerDown,
        onResizePointerMove: handleResizePointerMove,
        onResizePointerEnd: handleResizePointerEnd,
        onApplyCameraPose: applyCameraPose,
      }}
    />
  );
}
