import {
  DEFAULT_NETWORK_MATRIX_SELECTOR_MODE,
  DEFAULT_NETWORK_SUMMARY_INCLUDE_DIAGONAL,
  DEFAULT_NETWORK_SUMMARY_INCLUDE_ZERO_EDGES,
  DEFAULT_NETWORK_SUMMARY_TOP_ITEMS_LIMIT,
  DEFAULT_NETWORK_SUMMARY_VIEW_FIELD_IDS,
  NETWORK_SUMMARY_FIELD_IDS,
} from "@/config/ui";
import type {
  NetworkSummaryControlsState,
  NetworkSummaryFieldId,
  NetworkSummaryFieldVisibility,
  NetworkSummaryResult,
  NetworkSummarySettings,
  NetworkSummaryStatus,
} from "@/types/networkMeasures";

const createDefaultFieldVisibility = () =>
  NETWORK_SUMMARY_FIELD_IDS.reduce(
    (acc, id) => {
      acc[id] = {
        summaryTab: true,
        viewSummaries:
          DEFAULT_NETWORK_SUMMARY_VIEW_FIELD_IDS.includes(id),
      };
      return acc;
    },
    {} as Record<NetworkSummaryFieldId, NetworkSummaryFieldVisibility>,
  );

export const createDefaultNetworkSummarySettings =
  (): NetworkSummarySettings => ({
    includeDiagonal: DEFAULT_NETWORK_SUMMARY_INCLUDE_DIAGONAL,
    includeZeroEdges: DEFAULT_NETWORK_SUMMARY_INCLUDE_ZERO_EDGES,
    topItemsLimit: DEFAULT_NETWORK_SUMMARY_TOP_ITEMS_LIMIT,
    visibleFields: createDefaultFieldVisibility(),
  });

export type NetworkMeasuresSliceState = {
  controls: NetworkSummaryControlsState;
  settings: NetworkSummarySettings;
  summary: NetworkSummaryResult | null;
  status: NetworkSummaryStatus;
  error: string | null;
};

export const initialNetworkMeasuresState: NetworkMeasuresSliceState = {
  controls: {
    matrixSelectorMode: DEFAULT_NETWORK_MATRIX_SELECTOR_MODE,
    populationKey: "",
    measureId: "",
    statId: "",
    layerId: "",
    selectedCompoundId: "",
  },
  settings: createDefaultNetworkSummarySettings(),
  summary: null,
  status: "idle",
  error: null,
};
