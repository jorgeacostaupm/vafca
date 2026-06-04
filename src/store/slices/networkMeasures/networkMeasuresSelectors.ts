import type { RootState } from "@/types/store";

export const selectNetworkMeasuresState = (state: RootState) =>
  state.networkMeasures;

export const selectNetworkSummaryControls = (state: RootState) =>
  state.networkMeasures.controls;

export const selectNetworkSummarySettings = (state: RootState) =>
  state.networkMeasures.settings;

export const selectNetworkSummaryResult = (state: RootState) =>
  state.networkMeasures.summary;

export const selectNetworkSummaryStatus = (state: RootState) =>
  state.networkMeasures.status;

export const selectNetworkSummaryError = (state: RootState) =>
  state.networkMeasures.error;
