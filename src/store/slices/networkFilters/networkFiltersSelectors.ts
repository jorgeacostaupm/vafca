import type { RootState } from "@/types/store";

export const selectNetworkFiltersState = (state: RootState) => state.networkFilters;
export const selectActiveNetworkEdgeMask = (state: RootState) =>
  state.networkFilters.activeEdgeMask;
export const selectActiveAggregatedNetworkEdgeMask = (state: RootState) =>
  state.networkFilters.activeAggregatedEdgeMask;
