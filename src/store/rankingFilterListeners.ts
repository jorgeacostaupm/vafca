import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  applyNetworkEdgeFilter,
  clearNetworkEdgeFilter,
} from "@/store/slices/networkFilters";
import { recomputeRankingsForActiveFilters } from "@/store/slices/rankings";

export const rankingFilterListenerMiddleware = createListenerMiddleware();

rankingFilterListenerMiddleware.startListening({
  matcher: isAnyOf(applyNetworkEdgeFilter, clearNetworkEdgeFilter),
  effect: async (_, { dispatch }) => {
    await dispatch(recomputeRankingsForActiveFilters() as never);
  },
});
