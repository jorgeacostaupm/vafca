import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  applyNetworkEdgeFilter,
  clearNetworkEdgeFilter,
} from "@/store/slices/networkVisualization";
import { recomputeRankingsForActiveFilters } from "@/store/slices/rankings";

export const rankingFilterListenerMiddleware = createListenerMiddleware();

rankingFilterListenerMiddleware.startListening({
  matcher: isAnyOf(applyNetworkEdgeFilter, clearNetworkEdgeFilter),
  effect: async (_, { dispatch }) => {
    await dispatch(recomputeRankingsForActiveFilters() as never);
  },
});
