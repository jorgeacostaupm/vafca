import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  clearDataset,
  computeDerivedMatrices,
  loadDatasetFromUploadedZip,
  loadInitialDataset,
} from "@/store/slices/dataset";
import type {
  NetworkSummaryControlsState,
  NetworkSummaryFieldId,
  NetworkSummaryFieldVisibility,
} from "@/types/networkMeasures";

import {
  createDefaultNetworkSummarySettings,
  initialNetworkMeasuresState,
} from "./networkMeasuresTypes";
import { computeNetworkSummary } from "./thunks";

const networkMeasuresSlice = createSlice({
  name: "networkMeasures",
  initialState: initialNetworkMeasuresState,
  reducers: {
    patchNetworkSummaryControls(
      state,
      action: PayloadAction<Partial<NetworkSummaryControlsState>>,
    ) {
      state.controls = {
        ...state.controls,
        ...action.payload,
      };
      state.summary = null;
      state.status = "idle";
      state.error = null;
    },
    patchNetworkSummarySettings(
      state,
      action: PayloadAction<{
        includeDiagonal?: boolean;
        includeZeroEdges?: boolean;
        topItemsLimit?: number;
      }>,
    ) {
      state.settings = {
        ...state.settings,
        ...action.payload,
      };
      state.summary = null;
      state.status = "idle";
      state.error = null;
    },
    setNetworkSummaryFieldVisibility(
      state,
      action: PayloadAction<{
        fieldId: NetworkSummaryFieldId;
        target: keyof NetworkSummaryFieldVisibility;
        visible: boolean;
      }>,
    ) {
      const current = state.settings.visibleFields[action.payload.fieldId];
      if (!current) return;
      current[action.payload.target] = action.payload.visible;
    },
    resetNetworkSummarySettings(state) {
      state.settings = createDefaultNetworkSummarySettings();
      state.summary = null;
      state.status = "idle";
      state.error = null;
    },
    clearNetworkSummary(state) {
      state.summary = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(clearDataset, (state) => {
        state.summary = null;
        state.status = "idle";
        state.error = null;
        state.controls.selectedCompoundId = "";
      })
      .addCase(loadInitialDataset.pending, (state) => {
        state.summary = null;
        state.status = "idle";
        state.error = null;
        state.controls.selectedCompoundId = "";
      })
      .addCase(loadDatasetFromUploadedZip.fulfilled, (state) => {
        state.summary = null;
        state.status = "idle";
        state.error = null;
        state.controls.selectedCompoundId = "";
      })
      .addCase(computeDerivedMatrices.fulfilled, (state) => {
        state.summary = null;
        state.status = "idle";
        state.error = null;
      })
      .addCase(computeNetworkSummary.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(computeNetworkSummary.fulfilled, (state, action) => {
        state.status = "ready";
        state.summary = action.payload;
        state.error = null;
      })
      .addCase(computeNetworkSummary.rejected, (state, action) => {
        state.status = "error";
        state.error =
          action.payload ?? action.error.message ?? "Failed to compute summary.";
      });
  },
});

export const {
  patchNetworkSummaryControls,
  patchNetworkSummarySettings,
  setNetworkSummaryFieldVisibility,
  resetNetworkSummarySettings,
  clearNetworkSummary,
} = networkMeasuresSlice.actions;

export default networkMeasuresSlice.reducer;
