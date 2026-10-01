import { Card, Splitter } from "antd";
import { useCallback, useMemo, useState } from "react";

import AnnotationNodesTable from '@/components/annotations/AnnotationNodesTable';
import SelectedLinksAtlas from "@/components/selected-links/SelectedLinksAtlas";
import SelectedLinksColumnsModal from "@/components/selected-links/SelectedLinksColumnsModal";
import SelectedLinksControls from "@/components/selected-links/SelectedLinksControls";
import type { SelectedLinksFallbackNodeMode } from "@/components/selected-links/selectedLinksFallbackGraph";
import type { SelectedLinksFallbackViewType } from "@/components/selected-links/SelectedLinksFallbackView";
import type {
  DownloadMode,
  NetworkOption,
} from "@/components/selected-links/selectedLinksPanel.types";
import {
  buildNetworkColumns,
  buildNetworkSummaryLabelMap,
  buildRows,
  buildSourceLabelMap,
} from "@/components/selected-links/selectedLinksPanel.utils";
import SelectedLinksTable from "@/components/selected-links/SelectedLinksTable";
import { useSelectedLinkNetworkLookup } from "@/components/selected-links/useSelectedLinkNetworkLookup";
import { useSelectedLinkNetworkSelection } from "@/components/selected-links/useSelectedLinkNetworkSelection";
import { useNetworkFilterOptions } from "@/components/selectors/useNetworkFilterOptions";
import {
  SELECTED_LINKS_SPLIT_DEFAULT,
  SELECTED_LINKS_SPLIT_MIN,
} from "@/config/ui";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useDatasetNetworkSummaries } from "@/hooks/useDatasetNetworkSummaries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { selectNetworkControls } from "@/store/slices/networkVisualization";
import {
  clearSelectedLinks,
  downloadSelectedLinks,
  removeSelectedLink,
  setAtlasLinkIds,
  toggleAtlasLinkId,
} from "@/store/slices/visualizationUi";
import { selectAtlasLinkIds } from '@/store/slices/visualizationUi/annotationSelectors';
import { selectSelectedLinks } from '@/store/slices/visualizationUi/annotationSelectors';
import { atlasSupports3d } from "@/utils/atlas/atlasDefinition";
import {
  getDatasetAtlasId,
  getDatasetCatalogs,
} from "@/utils/datasetAccessors";
import { buildNetworkSummaryLabel } from "@/utils/matrixViewUtils";
import { patchWorkspaceUi } from '@/workspace/workspaceUiSlice';

export default function SelectedLinksPanel() {
  const dispatch = useAppDispatch();
  const [listType, setListType] = useState<"links" | "nodes">("links");
  const links = useAppSelector(selectSelectedLinks);
  const atlasLinkIds = useAppSelector(
    selectAtlasLinkIds,
  );
  const downloadStatus = useAppSelector(
    (state) => state.visualizationUi.selectedLinksDownloadStatus,
  );
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const networkControls = useAppSelector(selectNetworkControls);
  const catalogs = getDatasetCatalogs(dataset);
  const atlas = useAppSelector((state) => state.atlasUi);
  const atlas3dEnabled = useAppSelector(
    (state) => state.visualizationUi.atlasPanel.is3dAvailable,
  );
  const atlasOrder = useAppSelector((state) => state.atlasUi.order);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));
  const selectedLinksAtlas3dAvailable =
    atlas3dEnabled && atlasSupports3d(atlasDefinition);
  const { summaries, status } = useDatasetNetworkSummaries();
  const { selectedNetworkIds, setUserSelectedNetworkIds } =
    useSelectedLinkNetworkSelection(links);
  const { networkLookup, loadingNetworks } = useSelectedLinkNetworkLookup(selectedNetworkIds);
  const [networkFields, setNetworkFields] = useState({
    sourceId: "",
    measureId: "",
    statisticId: "",
    aspectFilters: {} as Record<string, string>,
  });
  const [selectedNetworkId, setSelectedNetworkId] = useState("");
  const [columnsModalOpen, setColumnsModalOpen] = useState(false);
  const workspaceUi = useAppSelector(state => state.workspaceUi);
  const selectedLinksViewEnabled = workspaceUi.linksViewEnabled;
  const selectedLinksViewType = workspaceUi.linksViewType;
  const selectedLinksNodeMode = workspaceUi.linksNodeMode;
  const setSelectedLinksViewEnabled = (linksViewEnabled: boolean) => dispatch(patchWorkspaceUi({ linksViewEnabled }));
  const setSelectedLinksViewType = (linksViewType: SelectedLinksFallbackViewType) => dispatch(patchWorkspaceUi({ linksViewType }));
  const setSelectedLinksNodeMode = (linksNodeMode: SelectedLinksFallbackNodeMode) => dispatch(patchWorkspaceUi({ linksNodeMode }));
  const {
    sourceOptions,
    measures,
    statisticOptions,
    aspectOptions,
    matches,
  } = useNetworkFilterOptions({
    dataset,
    atlas,
    summaries,
    sourceId: networkFields.sourceId,
    measureId: networkFields.measureId,
    statisticId: networkFields.statisticId,
    aspectFilters: networkFields.aspectFilters,
  });

  const networkOptions = useMemo<NetworkOption[]>(() => {
    return summaries
      .map((summary) => ({
        value: summary.compoundId,
        label: buildNetworkSummaryLabel(summary, catalogs),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [summaries, catalogs]);

  const networkLabelMap = useMemo(() => {
    return buildNetworkSummaryLabelMap(networkOptions);
  }, [networkOptions]);

  const sourceLabelMap = useMemo(() => {
    return buildSourceLabelMap(links);
  }, [links]);

  const atlasIndex = useMemo(() => {
    return new Map(atlasOrder.map((id, index) => [id, index]));
  }, [atlasOrder]);

  const networkColumns = useMemo(() => {
    return buildNetworkColumns(selectedNetworkIds, networkLabelMap, sourceLabelMap);
  }, [networkLabelMap, selectedNetworkIds, sourceLabelMap]);

  const rows = useMemo(() => {
    return buildRows({
      links,
      selectedNetworkIds,
      networkLookup,
      atlasIndex,
    });
  }, [links, selectedNetworkIds, networkLookup, atlasIndex]);

  const fieldSelectionComplete = Boolean(
    networkFields.sourceId &&
    networkFields.measureId &&
    networkFields.statisticId &&
    (catalogs?.aspects ?? []).every((aspect) => networkFields.aspectFilters[aspect.id]),
  );

  const addableNetworkIds = useMemo(() => {
    if (networkControls.matrixSelectorMode === "combined") {
      return selectedNetworkId ? [selectedNetworkId] : [];
    }

    if (!fieldSelectionComplete) return [];
    return matches.map((summary) => summary.compoundId);
  }, [
    fieldSelectionComplete,
    matches,
    networkControls.matrixSelectorMode,
    selectedNetworkId,
  ]);

  const hasAddableNetworkIds = addableNetworkIds.some(
    (id) => !selectedNetworkIds.includes(id),
  );

  const handleNetworkFieldsChange = useCallback(
    (patch: Partial<typeof networkFields>) => {
      setNetworkFields((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const handleAddNetworkColumns = useCallback(() => {
    setUserSelectedNetworkIds([
      ...selectedNetworkIds,
      ...addableNetworkIds.filter((id) => !selectedNetworkIds.includes(id)),
    ]);
  }, [addableNetworkIds, selectedNetworkIds, setUserSelectedNetworkIds]);

  const handleDownloadLinks = useCallback(
    (mode: DownloadMode) => {
      void dispatch(downloadSelectedLinks({ mode, selectedNetworkIds }));
    },
    [dispatch, selectedNetworkIds],
  );

  const handleSetAtlasLinkIds = useCallback(
    (ids: string[]) => {
      dispatch(setAtlasLinkIds(ids));
    },
    [dispatch],
  );

  const handleToggleAtlasLinkId = useCallback(
    (id: string) => {
      dispatch(toggleAtlasLinkId(id));
    },
    [dispatch],
  );

  const handleRemoveSelectedLink = useCallback(
    (id: string) => {
      dispatch(removeSelectedLink(id));
    },
    [dispatch],
  );

  const handleClearSelectedLinks = useCallback(() => {
    dispatch(clearSelectedLinks());
  }, [dispatch]);

  return (
    <div
      className={`links-panel ${
        selectedLinksViewEnabled
          ? "links-panel--view-enabled"
          : "links-panel--view-disabled"
      }`}
    >
      <Splitter className="links-panel__splitter" orientation="horizontal">
        <Splitter.Panel defaultSize={SELECTED_LINKS_SPLIT_DEFAULT} min={SELECTED_LINKS_SPLIT_MIN}>
          <div className="links-panel__list">
            <Card className="links-panel__control-card" variant="outlined">
              <SelectedLinksControls
                listType={listType}
                onListTypeChange={setListType}
                linksCount={links.length}
                downloading={downloadStatus === "loading"}
                onDownload={handleDownloadLinks}
                onClear={handleClearSelectedLinks}
                viewEnabled={selectedLinksViewEnabled}
                onViewEnabledChange={setSelectedLinksViewEnabled}
                onOpenColumns={() => setColumnsModalOpen(true)}
              />
              <SelectedLinksColumnsModal
                open={columnsModalOpen}
                onClose={() => setColumnsModalOpen(false)}
                networkOptions={networkOptions}
                selectedNetworkIds={selectedNetworkIds}
                selectedNetworkId={selectedNetworkId}
                networkOptionsLoading={status === "loading"}
                loadingNetworks={loadingNetworks}
                addColumnsDisabled={!hasAddableNetworkIds}
                onSelectedNetworkIdChange={setSelectedNetworkId}
                onAddColumns={handleAddNetworkColumns}
                matrixSelectorMode={networkControls.matrixSelectorMode}
                fields={networkFields}
                fieldOptions={{
                  sources: sourceOptions,
                  measures,
                  statistics: statisticOptions,
                  aspects: aspectOptions,
                }}
                labels={{
                  source: catalogs?.core.source.label ?? "Source",
                  measure: catalogs?.core.measure.label ?? "Measure",
                  statistic: catalogs?.core.statistic.label ?? "Statistic",
                }}
                onFieldsChange={handleNetworkFieldsChange}
              />
              <div className="links-panel__table">
                {listType === "nodes" ? (
                  <AnnotationNodesTable />
                ) : (
                  <SelectedLinksTable
                    rows={rows}
                    networkColumns={networkColumns}
                    atlasLinkIds={atlasLinkIds}
                    onSetAtlasLinkIds={handleSetAtlasLinkIds}
                    onToggleAtlasLinkId={handleToggleAtlasLinkId}
                    onRemoveSelectedLink={handleRemoveSelectedLink}
                  />
                )}
              </div>
            </Card>
          </div>
        </Splitter.Panel>
        {selectedLinksViewEnabled ? (
          <Splitter.Panel defaultSize={SELECTED_LINKS_SPLIT_DEFAULT} min={SELECTED_LINKS_SPLIT_MIN}>
            <div className="links-panel__atlas">
              <SelectedLinksAtlas
                viewType={selectedLinksViewType}
                nodeMode={selectedLinksNodeMode}
                useAtlas3d={selectedLinksAtlas3dAvailable}
                onViewTypeChange={setSelectedLinksViewType}
                onNodeModeChange={setSelectedLinksNodeMode}
              />
            </div>
          </Splitter.Panel>
        ) : null}
      </Splitter>
    </div>
  );
}
