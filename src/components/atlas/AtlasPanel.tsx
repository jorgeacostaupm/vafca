import { useMemo, useState } from "react";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "@/store/hooks";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { getCommonRoiFields } from "@/utils/atlas/atlasDefinition";
import { useAtlasPanelData } from "./atlasPanelHooks";
import { AtlasPanelLayout } from "./AtlasPanelLayout";
import { useAtlasPanelNormalization } from "./hooks/useAtlasPanelNormalization";
import { useAtlasPanelDerivedData } from "./hooks/useAtlasPanelDerivedData";
import {
  selectAtlasColorFields,
  selectAtlasEnabledIds,
  selectAtlasLabelSearchTextById,
  selectAtlasOrder,
} from "@/store/slices/atlas";
import { AtlasPanelControls } from "./AtlasPanelControls";
import { AtlasPanelFilters } from "./AtlasPanelFilters";
import { AtlasPanelList } from "./AtlasPanelList";
import { AtlasPanelViewer } from "./AtlasPanelViewer";
import AtlasManagementModal from "./AtlasManagementModal";
import AtlasPanelToolbar from "./AtlasPanelToolbar";
import type { AtlasMeshMode } from "@/types/atlas";

const EXPANDED_GROUPS = new Set<string>();

export default function AtlasPanel() {
  const [meshMode, setMeshMode] = useState<AtlasMeshMode>("with_mesh_points");
  const [managementOpen, setManagementOpen] = useState(false);
  const atlasOrder = useAppSelector(selectAtlasOrder);
  const colorFields = useAppSelector(selectAtlasColorFields);
  const enabledIds = useAppSelector(selectAtlasEnabledIds, shallowEqual);
  const labelSearchTextById = useAppSelector(
    selectAtlasLabelSearchTextById,
    shallowEqual,
  );
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlasPanel = useAppSelector((state) => state.visualizationUi.atlasPanel);

  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );

  const availableGroupFields = useMemo(
    () => getCommonRoiFields(atlasDefinition),
    [atlasDefinition],
  );

  const has3d = useMemo(
    () => meshMode === "with_mesh_points" && Boolean(atlasDefinition?.rois?.length),
    [atlasDefinition, meshMode],
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
    columnSections,
    useColumns,
  } = useAtlasPanelDerivedData({
    atlasPanel,
    availableGroupFields,
    groupedRows,
  });

  return (
    <>
      <AtlasPanelLayout
        has3d={has3d}
        toolbar={
          <AtlasPanelToolbar
            meshMode={meshMode}
            onMeshModeChange={setMeshMode}
            onOpenManagement={() => setManagementOpen(true)}
          />
        }
        controls={
          <AtlasPanelControls
            totalCount={totalCount}
            enabledCount={enabledCount}
            groupByFields={atlasPanel.groupByFields}
            selectableGroupFields={selectableGroupFields}
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
        viewer={<AtlasPanelViewer enableMeshPoints={meshMode === "with_mesh_points"} />}
      />

      <AtlasManagementModal
        open={managementOpen}
        onClose={() => setManagementOpen(false)}
      />
    </>
  );
}
