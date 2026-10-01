import { useEffect, useMemo, useState } from "react";
import { shallowEqual } from "react-redux";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectAtlasColorFields,
  selectAtlasLabelsById,
  selectAtlasLabelSearchTextById,
  selectAtlasOrder,
} from "@/store/slices/atlasUi";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { atlasSupports3d, getCommonNodeFields } from "@/utils/atlas/atlasDefinition";

import AtlasManagementModal from "./AtlasManagementModal";
import { AtlasPanelFilters } from "./AtlasPanelFilters";
import { useAtlasPanelData } from "./atlasPanelHooks";
import { AtlasPanelLayout } from "./AtlasPanelLayout";
import { AtlasPanelList } from "./AtlasPanelList";
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
  const dispatch = useAppDispatch();
  const [managementOpen, setManagementOpen] = useState(false);
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

  const has3d = atlasSupports3d(stateAtlasDefinition);

  useAtlasPanelNormalization({
    colorFields,
    atlasPanel,
    availableGroupFields,
  });

  const {
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

  useEffect(() => {
    if (Object.keys(atlasPanel.selectedFilters).length === 0) return;
    dispatch(setAtlasPanelState({ selectedFilters: {}, collapsedGroups: [] }));
  }, [atlasPanel.selectedFilters, dispatch]);

  return (
    <>
      <AtlasPanelLayout
        has3d={has3d}
        toolbar={
          <AtlasPanelToolbar
            onOpenManagement={() => setManagementOpen(true)}
          />
        }
        filters={
          <AtlasPanelFilters
            query={atlasPanel.query}
            totalCount={totalCount}
            enabledCount={enabledCount}
            effectiveEnabledCount={effectiveEnabledCount}
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
        viewer={<AtlasPanelViewer enableSpatial />}
      />

      <AtlasManagementModal
        open={managementOpen}
        onClose={() => setManagementOpen(false)}
      />
    </>
  );
}
