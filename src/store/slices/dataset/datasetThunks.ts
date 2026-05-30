import { createAsyncThunk } from "@reduxjs/toolkit";
import type {
  DatasetMeta,
  MatrixStats,
  MatrixUploadRejected,
  MatrixUploadResult,
} from "@/types/datasetState";
import type { MatrixRecord } from "@/types/connectivityBundle";
import type {
  MatrixCalculationBatchRequest,
  MatrixCalculationResult,
} from "@/connectivity/calculations";
import type { MatrixOrderItem } from "@/types/matrixOrder";
import type { AtlasDefinition } from "@/types/atlas";
import type { RootState } from "@/types/store";
import { buildAtlasState, setAtlasLabels } from "@/store/slices/atlasUi";
import { setUploadedAtlas } from "@/store/slices/atlasDefinition";
import { calculateDerivedMatrices } from "@/connectivity/calculations";
import {
  type AggregatedMatrixOrderMode,
  buildRoiGroupsFromTags,
  computeAggregatedMatrix,
  createReducedMatrixRecord,
  findEquivalentReducedMatrix,
  getCurrentVisualizationGrouping,
  hashGroupOrder,
  hashRoiSet,
} from "@/connectivity/aggregation/roiGroupAggregation";
import type { ConnectivityImportMode } from "@/utils/import/types";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";
import { selectDatasetContent } from "./datasetSelectors";
import { setDataset } from "./datasetSlice";
import {
  importDatasetFromPublicZip,
  importDatasetFromUploadedZip,
} from "./datasetImport";

const DEFAULT_INITIAL_DATASET_PATH = "data/examples/02_rois_and_matrices.zip";

export type LoadInitialDatasetPayload = {
  path?: string;
};

export const loadInitialDataset = createAsyncThunk<
  DatasetMeta,
  LoadInitialDatasetPayload | void
>(
  "dataset/loadInitialDataset",
  async (payload, { dispatch }) => {
    const importedDataset = await importDatasetFromPublicZip(
      payload?.path ?? DEFAULT_INITIAL_DATASET_PATH,
      "lenient",
    );
    if (importedDataset.result.errors.length > 0) {
      throw new Error(importedDataset.result.errors[0]?.message);
    }
    dispatch(setDataset(importedDataset.datasetMeta));
    return importedDataset.datasetMeta;
  },
);

export const downloadCurrentDataset = createAsyncThunk<
  { fileName: string },
  void,
  { state: RootState; rejectValue: string }
>(
  "dataset/downloadCurrentDataset",
  async (_, { getState, rejectWithValue }) => {
    const datasetContent = selectDatasetContent(getState());
    if (!datasetContent) {
      return rejectWithValue("No dataset loaded yet.");
    }

    try {
      const payload = datasetContent;
      const datePart = new Date().toISOString().slice(0, 10);
      const fileName = `normalized-dataset-${datePart}.json`;
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      return { fileName };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to export dataset.",
      );
    }
  },
);

const yieldToBrowser = () =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0);
  });

export const computeDerivedMatrices = createAsyncThunk<
  MatrixCalculationResult,
  MatrixCalculationBatchRequest,
  { state: RootState; rejectValue: string }
>(
  "dataset/computeDerivedMatrices",
  async (request, { getState, rejectWithValue }) => {
    const datasetContent = selectDatasetContent(getState());
    if (!datasetContent) return rejectWithValue("No dataset is loaded.");
    await yieldToBrowser();
    const result = calculateDerivedMatrices(request, datasetContent);
    return result;
  },
);

export type ComputeAggregatedMatrixRequest = {
  baseMatrixIds: string[];
  orderMode: AggregatedMatrixOrderMode;
};

export type ComputeAggregatedMatrixResult = {
  matrices: MatrixRecord[];
  existing: MatrixRecord[];
  warnings: string[];
};

export const computeAggregatedMatrixFromVisualizationGroups = createAsyncThunk<
  ComputeAggregatedMatrixResult,
  ComputeAggregatedMatrixRequest,
  { state: RootState; rejectValue: string }
>(
  "dataset/computeAggregatedMatrixFromVisualizationGroups",
  async ({ baseMatrixIds, orderMode }, { getState, rejectWithValue }) => {
    const state = getState();
    const datasetContent = selectDatasetContent(state);
    if (!datasetContent) return rejectWithValue("No dataset is loaded.");

    const uniqueBaseMatrixIds = Array.from(new Set(baseMatrixIds.filter(Boolean)));
    if (uniqueBaseMatrixIds.length === 0) return rejectWithValue("No base matrix selected.");

    const baseMatrices = uniqueBaseMatrixIds.map((id) => datasetContent.matrixIndex[id]);
    if (baseMatrices.some((matrix) => !matrix)) {
      return rejectWithValue("One or more selected base matrices are not available.");
    }
    if (baseMatrices.some((matrix) => matrix.kind === "reduced")) {
      return rejectWithValue(
        "Esta matriz ya está agregada por grupos de ROIs. Selecciona una matriz ROI × ROI como base.",
      );
    }

    const categoryOrder =
      orderMode === "circular"
        ? state.atlasUi.circularHierarchyCategoryOrder
        : state.atlasUi.matrixHierarchyCategoryOrder;
    const grouping = getCurrentVisualizationGrouping(
      state.atlasUi.colorFields,
      categoryOrder,
    );
    if (!grouping) return rejectWithValue("No active tag grouping found.");

    const activeRoiIds = state.atlasUi.order.filter(
      (id) => state.atlasUi.labelsById[id]?.enabled !== false,
    );
    const activeRoiSet = new Set(activeRoiIds);
    const activeRoiSetHash = hashRoiSet(activeRoiIds);

    const missingFields = grouping.fields.filter(
      (field) => !datasetContent.atlas.rois.some((roi) => field in (roi.tags ?? {})),
    );
    if (missingFields.length > 0) {
      return rejectWithValue(`Selected tag does not exist: ${missingFields.join(", ")}.`);
    }

    await yieldToBrowser();
    const groupResult = buildRoiGroupsFromTags({
      atlas: datasetContent.atlas,
      fields: grouping.fields,
      categoryOrder: grouping.categoryOrder,
      activeRoiIds: activeRoiSet,
      missingTagPolicy: grouping.missingTagPolicy,
    });

    if (groupResult.groups.length < 2) {
      return rejectWithValue("Not enough active ROI groups to compute an aggregated matrix.");
    }
    const groupOrderHash = hashGroupOrder(
      groupResult.groups.map((group) => group.id),
    );

    const matrices: MatrixRecord[] = [];
    const existing: MatrixRecord[] = [];

    baseMatrices.forEach((baseMatrix) => {
      const equivalent = findEquivalentReducedMatrix(datasetContent.matrices, {
        baseMatrixId: baseMatrix.id,
        fields: grouping.fields,
        activeRoiSetHash,
        groupOrderHash,
        missingTagPolicy: grouping.missingTagPolicy,
        atlasId: datasetContent.atlas.id,
      });
      if (equivalent) {
        existing.push(equivalent);
        return;
      }

      const computed = computeAggregatedMatrix({
        baseMatrix,
        atlas: datasetContent.atlas,
        groups: groupResult.groups,
      });
      matrices.push(
        createReducedMatrixRecord({
          baseMatrix,
          atlas: datasetContent.atlas,
          groups: groupResult.groups,
          data: computed.data,
          cellCounts: computed.cellCounts,
          fields: grouping.fields,
          excludedRoiIds: groupResult.excludedRoiIds,
          activeRoiIds,
          activeRoiSetHash,
          groupOrderHash,
          orderMode,
          missingTagPolicy: grouping.missingTagPolicy,
        }),
      );
    });

    const warnings = [
      groupResult.missingTagRoiIds.length > 0
        ? "Some active ROIs do not have the selected tag and were assigned to Unknown."
        : null,
      groupResult.excludedRoiIds.length > 0
        ? "Inactive ROIs are excluded from the aggregation."
        : null,
      "This operation summarizes ROI-to-ROI values; it does not recompute PLV from source time series.",
    ].filter((message): message is string => message !== null);

    return { matrices, existing, warnings };
  },
);

export const loadDatasetFromUploadedZip = createAsyncThunk<
  MatrixUploadResult & {
    datasetMeta: DatasetMeta;
    matrixStats: MatrixStats;
    matrixOrder?: MatrixOrderItem[] | null;
    atlasCompatibilityWarning?: string;
  },
  { files: File[]; resetAtlas?: boolean; mode?: ConnectivityImportMode },
  { state: RootState; rejectValue: MatrixUploadRejected }
>(
  "dataset/loadDatasetFromUploadedZip",
  async ({ files, mode = "lenient" }, { dispatch, rejectWithValue }) => {
    if (files.length !== 1) {
      return rejectWithValue(
        { message: "Load exactly one ZIP dataset." },
      );
    }
    try {
      const importedDataset = await importDatasetFromUploadedZip(files[0], mode);
      const { datasetMeta, result } = importedDataset;

      if (result.errors.length > 0) {
        return rejectWithValue({
          message: result.errors.map((error) => error.message).join(" ") ||
            "The file was not loaded.",
          result,
        });
      }

      dispatch(setDataset(datasetMeta));

      dispatch(
        setUploadedAtlas({
          atlas: {
            id: datasetMeta.content.atlas.id,
            name: datasetMeta.content.atlas.name,
            rois: datasetMeta.content.atlas.rois.map((roi) => ({
              ...roi,
              tags: roi.tags as AtlasDefinition["rois"][number]["tags"],
              coords: roi.coords as AtlasDefinition["rois"][number]["coords"],
              metadata: roi.metadata,
            })),
          } satisfies AtlasDefinition,
          fileName: files[0].name,
        }),
      );
      dispatch(
        setAtlasLabels(
          buildAtlasState(
            normalizeMatrixOrder(importedDataset.matrixOrder),
          ),
        ),
      );

      return {
        ...result,
        datasetMeta,
        matrixStats: importedDataset.matrixStats,
        matrixOrder: importedDataset.matrixOrder,
      };
    } catch (error) {
      return rejectWithValue({
        message: error instanceof Error ? error.message : "The file is not valid ZIP.",
      });
    }
  },
);
