import { createAsyncThunk } from "@reduxjs/toolkit";

import { selectDatasetData } from "@/store/slices/dataset";
import type { NetworkSummaryResult } from "@/types/networkMeasures";
import type { RootState } from "@/types/store";
import { getDatasetNetworkByCompoundId } from "@/utils/datasetAccessors";
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

  const storedNetwork = getDatasetNetworkByCompoundId(dataset, compoundId);
  const network = storedNetwork
    ? dataset.content.networkIndex[storedNetwork.id]
    : undefined;
  if (!network) {
    return rejectWithValue("The selected network is not available.");
  }

  return buildNetworkSummary({
    dataset: dataset.content,
    network,
    nodeSet: dataset.content.nodeSet,
    activeGroupingFields: state.atlasUi.colorFields,
    options: {
      includeDiagonal: state.networkMeasures.settings.includeDiagonal,
      includeZeroEdges: state.networkMeasures.settings.includeZeroEdges,
      topItemsLimit: state.networkMeasures.settings.topItemsLimit,
    },
  });
});
