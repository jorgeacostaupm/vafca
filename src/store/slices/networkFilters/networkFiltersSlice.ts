import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { MatrixFilterDefinition, RuntimeEdgeMask } from "@/types/edgeFilter";

import { initialNetworkFiltersState } from "./networkFiltersTypes";

const networkFiltersSlice = createSlice({
  name: "networkFilters",
  initialState: initialNetworkFiltersState,
  reducers: {
    applyNetworkEdgeFilter(
      state,
      action: PayloadAction<{
        filter: MatrixFilterDefinition;
        mask: RuntimeEdgeMask;
      }>,
    ) {
      state.activeNetworkFilter = action.payload.filter;
      state.activeEdgeMask = action.payload.mask;
    },
    clearNetworkEdgeFilter(state) {
      state.activeNetworkFilter = null;
      state.activeEdgeMask = null;
    },
    applyAggregatedNetworkEdgeFilter(
      state,
      action: PayloadAction<{
        filter: MatrixFilterDefinition;
        mask: RuntimeEdgeMask;
      }>,
    ) {
      state.activeAggregatedNetworkFilter = action.payload.filter;
      state.activeAggregatedEdgeMask = action.payload.mask;
    },
    clearAggregatedNetworkEdgeFilter(state) {
      state.activeAggregatedNetworkFilter = null;
      state.activeAggregatedEdgeMask = null;
    },
  },
});

export const {
  applyNetworkEdgeFilter,
  clearNetworkEdgeFilter,
  applyAggregatedNetworkEdgeFilter,
  clearAggregatedNetworkEdgeFilter,
} = networkFiltersSlice.actions;

export default networkFiltersSlice.reducer;
