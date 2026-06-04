import { createAsyncThunk } from "@reduxjs/toolkit";

import { removeNetworkLayoutItems } from "@/store/slices/networkLayout";
import { pruneNetworkSelectionForDisabledCatalogItem } from "@/store/slices/networkVisualization";
import { pruneRankingQueriesForDisabledCatalogItem } from "@/store/slices/rankings";
import { pruneSelectedLinksForDisabledCatalogItem } from "@/store/slices/visualizationUi";
import type { UpdateCatalogPayload } from "@/types/datasetState";
import type { RootState } from "@/types/store";

import { updateCatalogItem } from "../datasetSlice";
import {
  type CatalogMatrixPrunePayload,
  getInvalidCompoundIdsForCatalogItem,
  getInvalidMatrixIdsForCatalogItem,
} from "../utils/catalogMatrixPruning";

const shouldPruneActiveMatrices = (payload: UpdateCatalogPayload) =>
  payload.changes.enabled === false &&
  ["populations", "measures", "stats", "layers"].includes(payload.catalog);

const viewMatchesCatalogFallback = (
  view: RootState["networkVisualization"]["viewsById"][string],
  payload: CatalogMatrixPrunePayload,
) => {
  if (payload.catalog === "measures") return view.measureId === payload.id;
  if (payload.catalog === "stats") return view.statId === payload.id;
  return false;
};

export const updateCatalogItemAndPruneActiveMatrices = createAsyncThunk<
  void,
  UpdateCatalogPayload,
  { state: RootState }
>(
  "dataset/updateCatalogItemAndPruneActiveMatrices",
  async (payload, { dispatch, getState }) => {
    dispatch(updateCatalogItem(payload));
    if (!shouldPruneActiveMatrices(payload)) return;

    const state = getState();
    const invalidCompoundIds = getInvalidCompoundIdsForCatalogItem(
      state.matrixSummaries.summaries,
      payload.catalog,
      payload.id,
    );
    const invalidMatrixIds = getInvalidMatrixIdsForCatalogItem(
      Object.values(state.dataset.matrices.entities),
      payload.catalog,
      payload.id,
    );
    const invalidCompoundIdSet = new Set(invalidCompoundIds);
    const prunePayload: CatalogMatrixPrunePayload = {
      catalog: payload.catalog,
      id: payload.id,
      invalidCompoundIds,
      invalidMatrixIds,
    };
    const viewIds = state.networkVisualization.viewsOrder.filter((viewId) => {
      const view = state.networkVisualization.viewsById[viewId];
      if (!view) return false;
      return (
        invalidCompoundIdSet.has(view.compoundId) ||
        viewMatchesCatalogFallback(view, prunePayload)
      );
    });

    if (viewIds.length > 0) {
      dispatch(removeNetworkLayoutItems({ viewIds }));
    }
    dispatch(pruneNetworkSelectionForDisabledCatalogItem(prunePayload));
    dispatch(pruneRankingQueriesForDisabledCatalogItem(prunePayload));
    dispatch(pruneSelectedLinksForDisabledCatalogItem(prunePayload));
  },
);
