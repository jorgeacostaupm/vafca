import { Space } from "antd";
import { useCallback, useMemo } from "react";

import SelectedLinksAtlas from "@/components/selected-links/SelectedLinksAtlas";
import SelectedLinksControls from "@/components/selected-links/SelectedLinksControls";
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
import { useNetworkSummaries } from "@/hooks/useNetworkSummaries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  clearSelectedLinks,
  downloadSelectedLinks,
  removeSelectedLink,
  setAtlasLinkIds,
  toggleAtlasLinkId,
} from "@/store/slices/visualizationUi";
import {
  getDatasetCatalogs,
  getDatasetNetworkStats,
} from "@/utils/datasetAccessors";
import { buildNetworkSummaryLabel } from "@/utils/matrixViewUtils";

export default function SelectedLinksPanel() {
  const dispatch = useAppDispatch();
  const links = useAppSelector((state) => state.visualizationUi.selectedLinks);
  const atlasLinkIds = useAppSelector(
    (state) => state.visualizationUi.atlasLinkIds,
  );
  const downloadStatus = useAppSelector(
    (state) => state.visualizationUi.selectedLinksDownloadStatus,
  );
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const catalogs = getDatasetCatalogs(dataset);
  const atlasOrder = useAppSelector((state) => state.atlasUi.order);
  const networkStats = getDatasetNetworkStats(dataset);
  const { summaries, status } = useNetworkSummaries(networkStats.total);
  const { selectedNetworkIds, setUserSelectedNetworkIds } =
    useSelectedLinkNetworkSelection(links);
  const { networkLookup, loadingNetworks } = useSelectedLinkNetworkLookup(selectedNetworkIds);

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
    <div className="links-panel">
      <div className="links-panel__table">
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <SelectedLinksControls
            linksCount={links.length}
            downloading={downloadStatus === "loading"}
            onDownload={handleDownloadLinks}
            onClear={handleClearSelectedLinks}
            networkOptions={networkOptions}
            selectedNetworkIds={selectedNetworkIds}
            networkOptionsLoading={status === "loading"}
            loadingNetworks={loadingNetworks}
            onSelectedNetworkIdsChange={setUserSelectedNetworkIds}
          />
          <SelectedLinksTable
            rows={rows}
            networkColumns={networkColumns}
            atlasLinkIds={atlasLinkIds}
            onSetAtlasLinkIds={handleSetAtlasLinkIds}
            onToggleAtlasLinkId={handleToggleAtlasLinkId}
            onRemoveSelectedLink={handleRemoveSelectedLink}
          />
        </Space>
      </div>
      <div className="links-panel__atlas">
        <SelectedLinksAtlas />
      </div>
    </div>
  );
}
