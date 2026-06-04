import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";

import {
  setAllLabels,
  setAtlasLabels,
  setLabelEnabled,
  setLabelsEnabled,
  setLabelsEnabledMap,
} from "@/store/slices/atlasUi";
import {
  applyNetworkEdgeFilter,
  clearNetworkEdgeFilter,
} from "@/store/slices/networkFilters";
import { recomputeRankingsForActiveFilters } from "@/store/slices/rankings";

export const rankingFilterListenerMiddleware = createListenerMiddleware();

rankingFilterListenerMiddleware.startListening({
  matcher: isAnyOf(
    applyNetworkEdgeFilter,
    clearNetworkEdgeFilter,
    setAllLabels,
    setAtlasLabels,
    setLabelEnabled,
    setLabelsEnabled,
    setLabelsEnabledMap,
  ),
  effect: async (_, { dispatch }) => {
    await dispatch(recomputeRankingsForActiveFilters() as never);
  },
});
