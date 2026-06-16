import { createAsyncThunk } from "@reduxjs/toolkit";

import { removeNetworkLayoutItems } from "@/store/slices/networkLayout";
import { pruneNetworkSelectionForDisabledCatalogItem } from "@/store/slices/networkVisualization";
import { pruneRankingQueriesForDisabledCatalogItem } from "@/store/slices/rankings";
import { pruneSelectedLinksForDisabledCatalogItem } from "@/store/slices/visualizationUi";
import type { UpdateCatalogPayload } from "@/types/datasetState";
import type { RootState } from "@/types/store";

import { updateCatalogItem } from "../datasetSlice";
import {
  type CatalogNetworkPrunePayload,
  getInvalidCompoundIdsForCatalogItem,
  getInvalidNetworkIdsForCatalogItem,
} from "../utils/catalogNetworkPruning";

const shouldPruneActiveNetworks = (payload: UpdateCatalogPayload) =>
  payload.changes.enabled === false &&
  ["populations", "measures", "statistics", "layers"].includes(payload.catalog);

const viewMatchesCatalogFallback = (
  view: RootState["networkVisualization"]["viewsById"][string],
  payload: CatalogNetworkPrunePayload,
) => {
  if (payload.catalog === "measures") return view.measureId === payload.id;
  if (payload.catalog === "statistics") return view.statId === payload.id;
  return false;
};

export const updateCatalogItemAndPruneActiveNetworks = createAsyncThunk<
  void,
  UpdateCatalogPayload,
  { state: RootState }
>(
  "dataset/updateCatalogItemAndPruneActiveNetworks",
  async (payload, { dispatch, getState }) => {
    dispatch(updateCatalogItem(payload));
    if (!shouldPruneActiveNetworks(payload)) return;

    const state = getState();
    const invalidCompoundIds = getInvalidCompoundIdsForCatalogItem(
      state.networkSummaries.summaries,
      payload.catalog,
      payload.id,
    );
    const invalidNetworkIds = getInvalidNetworkIdsForCatalogItem(
      Object.values(state.dataset.networks.entities),
      payload.catalog,
      payload.id,
    );
    const invalidCompoundIdSet = new Set(invalidCompoundIds);
    const prunePayload: CatalogNetworkPrunePayload = {
      catalog: payload.catalog,
      id: payload.id,
      invalidCompoundIds,
      invalidNetworkIds,
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
