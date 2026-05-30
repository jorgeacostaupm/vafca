import { useMemo, useState } from "react";
import { shallowEqual } from "react-redux";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { getCommonRoiFields } from "@/utils/atlas/atlasDefinition";
import { useAtlasPanelData } from "./atlasPanelHooks";
import { AtlasPanelLayout } from "./AtlasPanelLayout";
import { useAtlasPanelNormalization } from "./hooks/useAtlasPanelNormalization";
import { useAtlasPanelDerivedData } from "./hooks/useAtlasPanelDerivedData";
import {
  selectAtlasColorFields,
  selectAtlasEnabledIds,
  selectAtlasLabelsById,
  selectAtlasLabelSearchTextById,
  selectAtlasOrder,
} from "@/store/slices/atlasUi";
import { AtlasPanelControls } from "./AtlasPanelControls";
import { AtlasPanelFilters } from "./AtlasPanelFilters";
import { AtlasPanelList } from "./AtlasPanelList";
import { AtlasPanelViewer } from "./AtlasPanelViewer";
import AtlasManagementModal from "./AtlasManagementModal";
import AtlasPanelToolbar from "./AtlasPanelToolbar";
import type { AtlasDefinition, AtlasMeshMode } from "@/types/atlas";
import {
  getDatasetAtlasId,
  getDatasetAtlasLabel,
} from "@/utils/datasetAccessors";

const EXPANDED_GROUPS = new Set<string>();

export default function AtlasPanel() {
  const [meshMode, setMeshMode] = useState<AtlasMeshMode>("with_mesh_points");
  const [managementOpen, setManagementOpen] = useState(false);
  const atlasOrder = useAppSelector(selectAtlasOrder);
  const labelsById = useAppSelector(selectAtlasLabelsById, shallowEqual);
  const colorFields = useAppSelector(selectAtlasColorFields);
  const enabledIds = useAppSelector(selectAtlasEnabledIds, shallowEqual);
  const labelSearchTextById = useAppSelector(
    selectAtlasLabelSearchTextById,
    shallowEqual,
  );
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const datasetAtlasId = getDatasetAtlasId(dataset);
  const datasetAtlasLabel = getDatasetAtlasLabel(dataset);
  const atlasPanel = useAppSelector((state) => state.visualizationUi.atlasPanel);

  const atlasDefinition = useAtlasDefinition(datasetAtlasId);
  const stateAtlasDefinition = useMemo<AtlasDefinition | null>(() => {
    if (atlasDefinition || atlasOrder.length === 0) return atlasDefinition;

    return {
      id: datasetAtlasId ?? "active-atlas",
      name: datasetAtlasLabel,
      rois: atlasOrder.map((id, index) => {
        const label = labelsById[id];
        return {
          index,
          id,
          atlasId: id,
          name: label?.name ?? label?.label ?? id,
          label: label?.acronym ?? label?.label ?? id,
          tags: label?.tags ?? {},
          metadata: label?.metadata ?? {},
          coords: null,
        };
      }),
    };
  }, [atlasDefinition, atlasOrder, datasetAtlasId, datasetAtlasLabel, labelsById]);

  const availableGroupFields = useMemo(
    () => getCommonRoiFields(stateAtlasDefinition),
    [stateAtlasDefinition],
  );

  const has3d = useMemo(
    () => meshMode === "with_mesh_points" && Boolean(stateAtlasDefinition?.rois?.length),
    [stateAtlasDefinition, meshMode],
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
    atlasDefinition: stateAtlasDefinition,
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
