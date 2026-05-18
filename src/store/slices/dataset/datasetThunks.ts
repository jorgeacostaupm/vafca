import { createAsyncThunk } from "@reduxjs/toolkit";
import type { DatasetMeta, MatrixUploadResult } from "@/types/datasetState";
import type { MatrixRecord } from "@/types/connectivityBundle";
import type {
  MatrixCalculationBatchRequest,
  MatrixCalculationResult,
} from "@/connectivity/calculations";
import type { MatrixOrderItem } from "@/types/matrixOrder";
import type { AtlasDefinition } from "@/types/atlas";
import type { RootState } from "@/types/store";
import { buildAtlasState, setAtlasLabels } from "@/store/slices/atlas";
import { setUploadedAtlas } from "@/store/slices/atlasDefinition";
import { getAllMatrices, saveMatrices, upsertMatrices } from "@/utils/matrixStore";
import { buildMatrixStats } from "@/utils/matrixStats";
import { materializeMatrixData } from "@/utils/connectivityMatrix";
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
import {
  createDatasetMetaFromConnectivityState,
  createMatricesFromConnectivityState,
  loadConnectivityBundle,
} from "@/utils/connectivityLoader";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

const DEFAULT_TEST_DATASET_PATH = "data/examples/04_two_populations.json";

export type LoadTestDatasetPayload = {
  path?: string;
};

const buildPublicDataUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export const loadTestDataset = createAsyncThunk<
  DatasetMeta,
  LoadTestDatasetPayload | void
>(
  "dataset/loadTestDataset",
  async (payload) => {
    const response = await fetch(
      buildPublicDataUrl(payload?.path ?? DEFAULT_TEST_DATASET_PATH),
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json()) as unknown;
    const loaded = loadConnectivityBundle(json, { strict: true });
    if (!loaded.state) {
      throw new Error(
        loaded.errors[0]?.message ??
          "Failed to validate the bundled test dataset.",
      );
    }
    const matrices = createMatricesFromConnectivityState(loaded.state);
    await saveMatrices(matrices);

    return createDatasetMetaFromConnectivityState(loaded.state);
  },
);

export const downloadCurrentDataset = createAsyncThunk<
  { fileName: string },
  void,
  { state: RootState; rejectValue: string }
>(
  "dataset/downloadCurrentDataset",
  async (_, { getState, rejectWithValue }) => {
    const data = getState().dataset.data;
    if (!data) {
      return rejectWithValue("No dataset loaded yet.");
    }

    try {
      const payload = {
        schemaVersion: data.connectivity?.schemaVersion,
        bundle: data.connectivity?.loadedBundle,
        atlas: data.connectivity?.atlas,
        catalogs: data.connectivity?.catalogs,
        matrices: data.connectivity?.matrices ?? await getAllMatrices(),
      };
      const datePart = new Date().toISOString().slice(0, 10);
      const fileName = `dataset-${datePart}.json`;
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

const toConnectivityMatrix = (matrix: MatrixRecord) => ({
  id: matrix.id,
  bandId: matrix.context.bandId ?? "none",
  measureId: matrix.context.measureId,
  statId: matrix.stat.id,
  populationIds:
    matrix.source.level === "comparison"
      ? [
          ...(matrix.source.left.populationIds ?? []),
          ...(matrix.source.right.populationIds ?? []),
        ]
      : "populationIds" in matrix.source
        ? matrix.source.populationIds
        : [],
  data: materializeMatrixData(matrix),
  dataStats: matrix.dataStats,
});

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
    const connectivity = getState().dataset.data?.connectivity;
    if (!connectivity) return rejectWithValue("No connectivity dataset is loaded.");
    await yieldToBrowser();
    const result = calculateDerivedMatrices(request, connectivity);
    if (result.matrices.length > 0) {
      await upsertMatrices(result.matrices.map(toConnectivityMatrix));
    }
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
    const connectivity = state.dataset.data?.connectivity;
    if (!connectivity) return rejectWithValue("No connectivity dataset is loaded.");

    const uniqueBaseMatrixIds = Array.from(new Set(baseMatrixIds.filter(Boolean)));
    if (uniqueBaseMatrixIds.length === 0) return rejectWithValue("No base matrix selected.");

    const baseMatrices = uniqueBaseMatrixIds.map((id) => connectivity.matrixIndex[id]);
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
        ? state.atlas.circularHierarchyCategoryOrder
        : state.atlas.matrixHierarchyCategoryOrder;
    const grouping = getCurrentVisualizationGrouping(
      state.atlas.colorFields,
      categoryOrder,
    );
    if (!grouping) return rejectWithValue("No active tag grouping found.");

    const activeRoiIds = state.atlas.order.filter(
      (id) => state.atlas.labelsById[id]?.enabled !== false,
    );
    const activeRoiSet = new Set(activeRoiIds);
    const activeRoiSetHash = hashRoiSet(activeRoiIds);

    const missingFields = grouping.fields.filter(
      (field) => !connectivity.atlas.rois.some((roi) => field in (roi.tags ?? {})),
    );
    if (missingFields.length > 0) {
      return rejectWithValue(`Selected tag does not exist: ${missingFields.join(", ")}.`);
    }

    await yieldToBrowser();
    const groupResult = buildRoiGroupsFromTags({
      atlas: connectivity.atlas,
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
      const equivalent = findEquivalentReducedMatrix(connectivity.matrices, {
        baseMatrixId: baseMatrix.id,
        fields: grouping.fields,
        activeRoiSetHash,
        groupOrderHash,
        missingTagPolicy: grouping.missingTagPolicy,
        atlasId: connectivity.atlas.id,
      });
      if (equivalent) {
        existing.push(equivalent);
        return;
      }

      const computed = computeAggregatedMatrix({
        baseMatrix,
        atlas: connectivity.atlas,
        groups: groupResult.groups,
      });
      matrices.push(
        createReducedMatrixRecord({
          baseMatrix,
          atlas: connectivity.atlas,
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

    if (matrices.length > 0) {
      await upsertMatrices(matrices.map(toConnectivityMatrix));
    }
    return { matrices, existing, warnings };
  },
);

export const uploadMatricesIntoDataset = createAsyncThunk<
  MatrixUploadResult & {
    datasetMeta: DatasetMeta;
    matrixStats: DatasetMeta["matrixStats"];
    matrixOrder?: MatrixOrderItem[] | null;
    atlasCompatibilityWarning?: string;
  },
  { files: File[]; resetAtlas?: boolean },
  { state: RootState; rejectValue: string }
>(
  "dataset/uploadMatricesIntoDataset",
  async ({ files }, { dispatch, rejectWithValue }) => {
    if (files.length !== 1) {
      return rejectWithValue(
        "Load exactly one fc-connectivity-v1.0 JSON bundle. Incremental loading is not supported in v1.0.",
      );
    }
    try {
      const payload = JSON.parse(await files[0].text()) as unknown;
      const loaded = loadConnectivityBundle(payload, { strict: true });
      if (!loaded.state) {
        return rejectWithValue(
          loaded.errors.map((error) => error.message).join(" ") ||
            "The file was not loaded.",
        );
      }

      const matrices = createMatricesFromConnectivityState(
        loaded.state,
      );
      await saveMatrices(matrices);
      const datasetMeta = createDatasetMetaFromConnectivityState(
        loaded.state,
      );

      dispatch(
        setUploadedAtlas({
          atlas: {
            id: loaded.state.atlas.id,
            name: loaded.state.atlas.name,
            rois: loaded.state.atlas.rois.map((roi) => ({
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
            normalizeMatrixOrder(datasetMeta.metadata.matrixOrder),
          ),
        ),
      );

      return {
        files: 1,
        validMatrices: loaded.state.matrices.length,
        invalidMatrices: loaded.errors.length,
        errors: loaded.errors.map((error) => ({
          source: files[0].name,
          message: `${error.path}: ${error.message}`,
        })),
        warnings: loaded.warnings.map((warning) => ({
          source: files[0].name,
          message: `${warning.path}: ${warning.message}`,
        })),
        datasetMeta,
        matrixStats: buildMatrixStats(matrices),
        matrixOrder: datasetMeta.metadata.matrixOrder,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "The file is not valid JSON.",
      );
    }
  },
);
