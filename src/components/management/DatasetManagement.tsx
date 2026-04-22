import { Button, Space, Typography, message } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  downloadCurrentDataset,
  setDatasetMatrixShape,
  updateCatalogItem,
} from "@/store/slices/dataset";
import {
  patchNetworkControls,
  setNetworkHideIsolatedNodes,
} from "@/store/slices/networkVisualization";
import {
  setCircularHierarchyCategoryOrder,
  setCircularHierarchyFields,
  setMatrixHierarchyCategoryOrder,
  setMatrixHierarchyFields,
} from "@/store/slices/atlas";
import NetworkManagementControls from "@/components/network/NetworkManagementControls";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";
import AtlasUploader from "@/components/atlas/AtlasUploader";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import DatasetSummaryHeader from "@/components/management/components/DatasetSummaryHeader";
import MatrixSummarySection from "@/components/management/components/MatrixSummarySection";
import DatasetHierarchyManagement from "@/components/management/components/DatasetHierarchyManagement";
import CatalogManagementSections from "@/components/management/components/catalogs/CatalogManagementSections";
import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import type { UpdateCatalogItemHandler } from "@/components/management/types";

function DatasetManagement() {
  const dispatch = useAppDispatch();
  const { data, status, error, downloadStatus } = useAppSelector(
    (state) => state.dataset,
  );
  const matrixShape = useAppSelector((state) => state.visualizationUi.matrixShape);
  const networkControls = useAppSelector(
    (state) => state.networkVisualization.controls,
  );
  const atlas = useAppSelector((state) => state.atlas);

  const atlasDefinition = useAtlasDefinition(
    data?.metadata.atlasId ?? data?.metadata.atlas,
  );

  const {
    activeRoiIds,
    previewRadius,
    circularPreviewLayout,
    matrixPreviewIds,
    previewNodeColors,
    selectableCircularHierarchyFields,
    selectableMatrixHierarchyFields,
    circularCategoryOrderEditors,
    matrixCategoryOrderEditors,
  } = useManagementHierarchy({
    atlas,
    atlasDefinition,
  });

  if (status === "loading") {
    return <Typography.Text>Loading dataset…</Typography.Text>;
  }

  if (status === "error") {
    return <Typography.Text type="danger">Error: {error}</Typography.Text>;
  }

  if (!data) {
    return <Typography.Text>No dataset loaded yet.</Typography.Text>;
  }

  const matrixOrder = normalizeMatrixOrder(data.metadata.matrixOrder);
  const atlasLabel = data.metadata.atlasId ?? data.metadata.atlas ?? "Unknown";

  const updateItem: UpdateCatalogItemHandler = (catalog, id, changes) => {
    dispatch(updateCatalogItem({ catalog, id, changes }));
  };

  const handleDownload = () => {
    void dispatch(downloadCurrentDataset())
      .unwrap()
      .then(({ fileName }) => {
        message.success(`Dataset downloaded: ${fileName}`);
      })
      .catch((caught) => {
        const nextError =
          typeof caught === "string"
            ? caught
            : caught instanceof Error
              ? caught.message
              : "Failed to export dataset.";
        message.error(nextError);
      });
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <AtlasUploader />

      <DatasetSummaryHeader
        atlasLabel={atlasLabel}
        roiCount={matrixOrder.length}
        matrixCount={data.matrixStats.total}
        matrixShape={matrixShape}
        onMatrixShapeChange={(value) => {
          void dispatch(setDatasetMatrixShape({ shape: value }));
        }}
      />

      <div>
        <NetworkManagementControls
          syncZoom={networkControls.syncZoom}
          onToggleSyncZoom={(value) =>
            dispatch(
              patchNetworkControls({
                syncZoom: value,
              }),
            )
          }
          hideIsolatedNodes={networkControls.hideIsolatedNodes}
          onToggleHideIsolatedNodes={(value) =>
            dispatch(
              setNetworkHideIsolatedNodes({
                value,
              }),
            )
          }
        />
      </div>

      <MatrixSummarySection
        byMeasureStatPopulationSet={data.matrixStats.byMeasureStatPopulationSet}
        measures={data.catalogs.measures}
        stats={data.catalogs.stats}
        populations={data.catalogs.populations}
      />

      <Button
        size="small"
        onClick={handleDownload}
        loading={downloadStatus === "loading"}
      >
        Download dataset as JSON
      </Button>

      <DatasetHierarchyManagement
        atlas={atlas}
        activeRoiCount={activeRoiIds.length}
        previewRadius={previewRadius}
        circularPreviewLayout={circularPreviewLayout}
        matrixPreviewIds={matrixPreviewIds}
        previewNodeColors={previewNodeColors}
        selectableCircularHierarchyFields={selectableCircularHierarchyFields}
        selectableMatrixHierarchyFields={selectableMatrixHierarchyFields}
        circularCategoryOrderEditors={circularCategoryOrderEditors}
        matrixCategoryOrderEditors={matrixCategoryOrderEditors}
        onSetCircularHierarchyFields={(fields) =>
          dispatch(setCircularHierarchyFields(fields))
        }
        onSetMatrixHierarchyFields={(fields) =>
          dispatch(setMatrixHierarchyFields(fields))
        }
        onSetCircularCategoryOrder={(next) =>
          dispatch(setCircularHierarchyCategoryOrder(next))
        }
        onSetMatrixCategoryOrder={(next) =>
          dispatch(setMatrixHierarchyCategoryOrder(next))
        }
      />

      <CatalogManagementSections catalogs={data.catalogs} onUpdateItem={updateItem} />
    </Space>
  );
}

export default DatasetManagement;
