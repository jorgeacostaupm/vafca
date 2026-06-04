import { Space } from "antd";
import { useCallback, useMemo } from "react";

import SelectedLinksAtlas from "@/components/selected-links/SelectedLinksAtlas";
import SelectedLinksControls from "@/components/selected-links/SelectedLinksControls";
import type {
  DownloadMode,
  MatrixOption,
} from "@/components/selected-links/selectedLinksPanel.types";
import {
  buildMatrixColumns,
  buildMatrixLabelMap,
  buildRows,
  buildSourceLabelMap,
} from "@/components/selected-links/selectedLinksPanel.utils";
import SelectedLinksTable from "@/components/selected-links/SelectedLinksTable";
import { useSelectedLinkMatrixLookup } from "@/components/selected-links/useSelectedLinkMatrixLookup";
import { useSelectedLinkMatrixSelection } from "@/components/selected-links/useSelectedLinkMatrixSelection";
import { useMatrixSummaries } from "@/hooks/useMatrixSummaries";
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
  getDatasetMatrixStats,
} from "@/utils/datasetAccessors";
import { buildMatrixLabel } from "@/utils/matrixViewUtils";

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
  const matrixStats = getDatasetMatrixStats(dataset);
  const { summaries, status } = useMatrixSummaries(matrixStats.total);
  const { selectedMatrixIds, setUserSelectedMatrixIds } =
    useSelectedLinkMatrixSelection(links);
  const { matrixLookup, loadingMatrices } = useSelectedLinkMatrixLookup(selectedMatrixIds);

  const matrixOptions = useMemo<MatrixOption[]>(() => {
    return summaries
      .map((summary) => ({
        value: summary.compoundId,
        label: buildMatrixLabel(summary, catalogs),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [summaries, catalogs]);

  const matrixLabelMap = useMemo(() => {
    return buildMatrixLabelMap(matrixOptions);
  }, [matrixOptions]);

  const sourceLabelMap = useMemo(() => {
    return buildSourceLabelMap(links);
  }, [links]);

  const atlasIndex = useMemo(() => {
    return new Map(atlasOrder.map((id, index) => [id, index]));
  }, [atlasOrder]);

  const matrixColumns = useMemo(() => {
    return buildMatrixColumns(selectedMatrixIds, matrixLabelMap, sourceLabelMap);
  }, [matrixLabelMap, selectedMatrixIds, sourceLabelMap]);

  const rows = useMemo(() => {
    return buildRows({
      links,
      selectedMatrixIds,
      matrixLookup,
      atlasIndex,
    });
  }, [links, selectedMatrixIds, matrixLookup, atlasIndex]);

  const handleDownloadLinks = useCallback(
    (mode: DownloadMode) => {
      void dispatch(downloadSelectedLinks({ mode, selectedMatrixIds }));
    },
    [dispatch, selectedMatrixIds],
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
            matrixOptions={matrixOptions}
            selectedMatrixIds={selectedMatrixIds}
            matrixOptionsLoading={status === "loading"}
            loadingMatrices={loadingMatrices}
            onSelectedMatrixIdsChange={setUserSelectedMatrixIds}
          />
          <SelectedLinksTable
            rows={rows}
            matrixColumns={matrixColumns}
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
