import { createAsyncThunk } from "@reduxjs/toolkit";

import { selectDatasetData } from "@/store/slices/dataset";
import type { NetworkSummaryResult } from "@/types/networkMeasures";
import type { RootState } from "@/types/store";
import { getDatasetMatrixByCompoundId } from "@/utils/datasetAccessors";
import { buildNetworkSummary } from "@/utils/networkMeasures/networkSummary";

export const computeNetworkSummary = createAsyncThunk<
  NetworkSummaryResult,
  void,
  { state: RootState; rejectValue: string }
>("networkMeasures/computeNetworkSummary", async (_, { getState, rejectWithValue }) => {
  const state = getState();
  const dataset = selectDatasetData(state);
  const compoundId = state.networkMeasures.controls.selectedCompoundId;

  if (!dataset?.content) {
    return rejectWithValue("No dataset is loaded.");
  }
  if (!compoundId) {
    return rejectWithValue("Select a network before computing the summary.");
  }

  const storedMatrix = getDatasetMatrixByCompoundId(dataset, compoundId);
  const matrix = storedMatrix ? dataset.content.matrixIndex[storedMatrix.id] : undefined;
  if (!matrix) {
    return rejectWithValue("The selected matrix is not available.");
  }

  return buildNetworkSummary({
    connectivity: dataset.content,
    matrix,
    activeGroupingFields: state.atlasUi.colorFields,
    options: {
      includeDiagonal: state.networkMeasures.settings.includeDiagonal,
      includeZeroEdges: state.networkMeasures.settings.includeZeroEdges,
      topItemsLimit: state.networkMeasures.settings.topItemsLimit,
    },
  });
});
