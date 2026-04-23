import {
  useDeferredValue,
  useMemo,
} from "react";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "@/store/hooks";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import {
  atlasSupports3d,
  getCommonRoiFields,
} from "@/utils/atlas/atlasDefinition";
import { useAtlasPanelData } from "./atlasPanelHooks";
import { AtlasPanelLayout } from "./AtlasPanelLayout";
import { useAtlasPanelNormalization } from "./hooks/useAtlasPanelNormalization";
import { useAtlasPanelDerivedData } from "./hooks/useAtlasPanelDerivedData";
import {
  selectAtlasColorFields,
  selectAtlasColorPalette,
  selectAtlasEnabledIds,
  selectAtlasLabelSearchTextById,
  selectAtlasOrder,
} from "@/store/slices/atlas";
import { AtlasPanelControls } from "./AtlasPanelControls";
import { AtlasPanelFilters } from "./AtlasPanelFilters";
import { AtlasPanelList } from "./AtlasPanelList";
import { AtlasPanelViewer } from "./AtlasPanelViewer";

const EXPANDED_GROUPS = new Set<string>();

export default function AtlasPanel() {
  const atlasOrder = useAppSelector(selectAtlasOrder);
  const colorFields = useAppSelector(selectAtlasColorFields);
  const colorPalette = useAppSelector(selectAtlasColorPalette);
  const enabledIds = useAppSelector(selectAtlasEnabledIds, shallowEqual);
  const labelSearchTextById = useAppSelector(
    selectAtlasLabelSearchTextById,
    shallowEqual,
  );
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlasPanel = useAppSelector((state) => state.visualizationUi.atlasPanel);
  const uploadedAtlasSource = useAppSelector((state) => state.atlasDefinition.uploaded);
  const deferredEnabledIds = useDeferredValue(enabledIds);

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

  useAtlasPanelNormalization({
    colorFields,
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
    orderedIds: atlasOrder,
    labelSearchTextById,
    atlasDefinition,
    query: atlasPanel.query,
    groupByFields: atlasPanel.groupByFields,
    selectedFilters: atlasPanel.selectedFilters,
    collapsedGroups: EXPANDED_GROUPS,
    enabledCount: enabledIds.length,
  });

  const {
    groupedEntries,
    selectableGroupFields,
    selectableColorFields,
    columnSections,
    useColumns,
    colorCategories,
    colorPreviewItems,
  } = useAtlasPanelDerivedData({
    enabledIds: deferredEnabledIds,
    colorFields,
    colorPalette,
    atlasPanel,
    atlasDefinition,
    availableGroupFields,
    groupedRows,
  });

  return (
    <AtlasPanelLayout
      has3d={has3d}
      controls={
        <AtlasPanelControls
          totalCount={totalCount}
          enabledCount={enabledCount}
          groupByFields={atlasPanel.groupByFields}
          selectableGroupFields={selectableGroupFields}
          colorFields={colorFields}
          selectableColorFields={selectableColorFields}
          colorPalette={colorPalette}
          colorCategories={colorCategories}
          colorPreviewItems={colorPreviewItems}
        />
      }
      filters={
        <AtlasPanelFilters
          query={atlasPanel.query}
          groupByFields={atlasPanel.groupByFields}
          selectedFilters={atlasPanel.selectedFilters}
          fieldOptionsByField={fieldOptionsByField}
          totalCount={totalCount}
          allEnabled={allEnabled}
          allDisabled={allDisabled}
        />
      }
      list={
        <AtlasPanelList
          groupedEntries={groupedEntries}
          columnSections={columnSections}
          useColumns={useColumns}
        />
      }
      viewer={<AtlasPanelViewer />}
    />
  );
}
