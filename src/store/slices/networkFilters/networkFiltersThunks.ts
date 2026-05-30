import { createAsyncThunk } from "@reduxjs/toolkit";
import { selectDatasetData } from "@/store/slices/dataset";
import type { RootState } from "@/types/store";
import type { MatrixFilterDefinition } from "@/types/edgeFilter";
import {
  applyAggregatedNetworkEdgeFilter,
  applyNetworkEdgeFilter,
} from "./networkFiltersSlice";
import { resolveNetworkFilterRuntime } from "./networkFiltersRuntime";
import type {
  NetworkEdgeFilterMode,
  NetworkFilterRuntime,
} from "./networkFiltersTypes";

export const applyNetworkFilterFromDefinition = createAsyncThunk<
  NetworkFilterRuntime,
  {
    mode: NetworkEdgeFilterMode;
    definition: MatrixFilterDefinition;
  },
  { state: RootState; rejectValue: string }
>(
  "networkFilters/applyFromDefinition",
  async ({ mode, definition }, { dispatch, getState, rejectWithValue }) => {
    const state = getState();
    const runtime = resolveNetworkFilterRuntime({
      mode,
      definition,
      dataset: selectDatasetData(state),
      uiRangeMode: state.visualizationUi.uiRangeMode,
    });

    if (!runtime.edgeDomain) {
      return rejectWithValue("The network edge domain is not available.");
    }
    if (!runtime.validation.valid) {
      return rejectWithValue(
        runtime.validation.errors.map((error) => error.message).join("\n"),
      );
    }
    if (!runtime.mask) {
      return rejectWithValue("The network filter could not be computed.");
    }

    dispatch(
      mode === "aggregated"
        ? applyAggregatedNetworkEdgeFilter({
            filter: runtime.normalizedFilter,
            mask: runtime.mask,
          })
        : applyNetworkEdgeFilter({
            filter: runtime.normalizedFilter,
            mask: runtime.mask,
          }),
    );

    return runtime;
  },
);
