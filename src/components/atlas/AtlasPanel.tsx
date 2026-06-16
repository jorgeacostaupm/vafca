import { useMemo, useState } from "react";
import { shallowEqual } from "react-redux";

import { useAppSelector } from "@/store/hooks";
import {
  selectAtlasColorFields,
  selectAtlasLabelsById,
  selectAtlasLabelSearchTextById,
  selectAtlasOrder,
} from "@/store/slices/atlasUi";
import { getCommonNodeFields } from "@/utils/atlas/atlasDefinition";
import { atlasSupports3d } from "@/utils/atlas/atlasDefinition";

import AtlasManagementModal from "./AtlasManagementModal";
import { AtlasPanelControls } from "./AtlasPanelControls";
import { AtlasPanelFilters } from "./AtlasPanelFilters";
import { useAtlasPanelData } from "./atlasPanelHooks";
import { AtlasPanelLayout } from "./AtlasPanelLayout";
import { AtlasPanelList } from "./AtlasPanelList";
import AtlasPanelSettingsModal from "./AtlasPanelSettingsModal";
import AtlasPanelToolbar from "./AtlasPanelToolbar";
import { AtlasPanelViewer } from "./AtlasPanelViewer";
import { useActiveAtlasDefinition } from "./hooks/useActiveAtlasDefinition";
import { useAtlasPanelDerivedData } from "./hooks/useAtlasPanelDerivedData";
import { useAtlasPanelNormalization } from "./hooks/useAtlasPanelNormalization";
import {
  buildEffectiveNodeEnabledMap,
  countEnabledNodes,
} from "./nodeVisibilityDraft";

const EXPANDED_GROUPS = new Set<string>();

export default function AtlasPanel() {
  const [managementOpen, setManagementOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const atlasOrder = useAppSelector(selectAtlasOrder);
  const labelsById = useAppSelector(selectAtlasLabelsById);
  const colorFields = useAppSelector(selectAtlasColorFields);
  const labelSearchTextById = useAppSelector(
    selectAtlasLabelSearchTextById,
    shallowEqual,
  );
  const atlasPanel = useAppSelector((state) => state.visualizationUi.atlasPanel);
  const effectiveEnabledById = useMemo(
    () =>
      buildEffectiveNodeEnabledMap({
        order: atlasOrder,
        labelsById,
        draft: atlasPanel.nodeVisibilityDraft,
      }),
    [atlasOrder, atlasPanel.nodeVisibilityDraft, labelsById],
  );
  const effectiveEnabledCount = useMemo(
    () => countEnabledNodes(effectiveEnabledById),
    [effectiveEnabledById],
  );

  const stateAtlasDefinition = useActiveAtlasDefinition();

  const availableGroupFields = useMemo(
    () => getCommonNodeFields(stateAtlasDefinition),
    [stateAtlasDefinition],
  );

  const has3d = useMemo(
    () =>
      atlasPanel.is3dAvailable &&
      atlasSupports3d(stateAtlasDefinition),
    [atlasPanel.is3dAvailable, stateAtlasDefinition],
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
    enabledCount: effectiveEnabledCount,
  });

  const {
    groupedEntries,
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
            onOpenManagement={() => setManagementOpen(true)}
          />
        }
        controls={
          <AtlasPanelControls
            totalCount={totalCount}
            enabledCount={enabledCount}
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
            onOpenSettings={() => setSettingsOpen(true)}
          />
        }
        list={
          <AtlasPanelList
            groupedEntries={groupedEntries}
            columnSections={columnSections}
            useColumns={useColumns}
          />
        }
        viewer={<AtlasPanelViewer enableMeshPoints />}
      />

      <AtlasManagementModal
        open={managementOpen}
        onClose={() => setManagementOpen(false)}
      />
      <AtlasPanelSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
