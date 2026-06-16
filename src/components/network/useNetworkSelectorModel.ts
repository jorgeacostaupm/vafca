import { useCallback } from "react";

import { useNetworkViewLifecycle } from "@/components/network/useNetworkViewLifecycle";
import { useNetworkFilterOptions } from "@/components/selectors/useNetworkFilterOptions";
import { useNetworkSummaries } from "@/hooks/useNetworkSummaries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  addNetworkViewAndFormat,
  patchNetworkControls,
} from "@/store/slices/networkVisualization";
import {
  getDatasetCatalogs,
  getDatasetNetworkStats,
} from "@/utils/datasetAccessors";
import { buildNetworkSummaryLabel, normalizePopulationKey } from "@/utils/matrixViewUtils";

export const useNetworkSelectorModel = () => {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const catalogs = getDatasetCatalogs(dataset);
  const atlas = useAppSelector((state) => state.atlasUi);
  const controls = useAppSelector((state) => state.networkVisualization.controls);
  const networkStats = getDatasetNetworkStats(dataset);
  const { summaries, status, error } = useNetworkSummaries(networkStats.total);

  const {
    populationOptions,
    measures,
    statOptions,
    layerOptions,
    matches,
    allNetworkOptions,
    selectableNetworkSummaries,
  } = useNetworkFilterOptions({
    dataset,
    atlas,
    summaries,
    populationKey: controls.populationKey,
    measureId: controls.measureId,
    statId: controls.statId,
    layerId: controls.layerId,
  });

  useNetworkViewLifecycle({
    matches,
    summariesStatus: status,
    summaries,
  });

  const handlePopulationChange = useCallback(
    (value?: string) => {
      dispatch(
        patchNetworkControls({
          populationKey: value ?? "",
          measureId: "",
          statId: "",
          layerId: "",
          selectedCompoundId: "",
        }),
      );
    },
    [dispatch],
  );

  const handleMeasureChange = useCallback(
    (value?: string) => {
      dispatch(
        patchNetworkControls({
          measureId: value ?? "",
          statId: "",
          layerId: "",
          selectedCompoundId: "",
        }),
      );
    },
    [dispatch],
  );

  const handleStatChange = useCallback(
    (value?: string) => {
      dispatch(
        patchNetworkControls({
          statId: value ?? "",
          layerId: "",
          selectedCompoundId: "",
        }),
      );
    },
    [dispatch],
  );

  const handleLayerChange = useCallback(
    (value?: string) => {
      dispatch(
        patchNetworkControls({
          layerId: value ?? "",
          selectedCompoundId: "",
        }),
      );
    },
    [dispatch],
  );

  const handleNetworkChange = useCallback(
    (value?: string) => {
      if (!value) {
        const shouldClearFields = controls.matrixSelectorMode === "combined";
        dispatch(
          patchNetworkControls({
            populationKey: shouldClearFields ? "" : controls.populationKey,
            measureId: shouldClearFields ? "" : controls.measureId,
            statId: shouldClearFields ? "" : controls.statId,
            layerId: shouldClearFields ? "" : controls.layerId,
            selectedCompoundId: "",
          }),
        );
        return;
      }

      const summary = selectableNetworkSummaries.find(
        (item) => item.compoundId === value,
      );
      if (!summary) {
        console.info("[network-selector] selected network was not found", {
          selectedValue: value,
          availableCompoundIds: selectableNetworkSummaries.map(
            (item) => item.compoundId,
          ),
        });
        dispatch(patchNetworkControls({ selectedCompoundId: "" }));
        return;
      }

      const matchingSummaries = selectableNetworkSummaries.filter(
        (item) => item.compoundId === value,
      );
      const matchingOptions = allNetworkOptions.filter(
        (option) => option.value === value,
      );
      const derivedPopulationKey = normalizePopulationKey(summary.populationIds);
      console.info("[network-selector] selected network metadata", {
        selectedValue: value,
        selectorValueFields: {
          compoundId: summary.compoundId,
          layerId: summary.layerId,
          measureId: summary.measureId,
          statId: summary.statId,
          populationIds: summary.populationIds,
          normalizedPopulationKey: derivedPopulationKey,
        },
        selectorDisplayFields: {
          label: buildNetworkSummaryLabel(summary, catalogs),
          populationLabel: summary.populationIds
            .map((id) => catalogs?.populations[id]?.label ?? id)
            .join(" vs "),
          measureLabel: catalogs?.measures[summary.measureId]?.label ?? summary.measureId,
          statLabel: catalogs?.statistics[summary.statId]?.label ?? summary.statId,
          layerLabel: catalogs?.layers[summary.layerId]?.label ?? summary.layerId,
        },
        summary,
        derivedPopulationKey,
        matchingSummariesCount: matchingSummaries.length,
        matchingSummaries,
        matchingOptions,
        currentControls: controls,
      });

      dispatch(
        patchNetworkControls({
          populationKey: derivedPopulationKey,
          measureId: summary.measureId,
          statId: summary.statId,
          layerId: summary.layerId,
          selectedCompoundId: summary.compoundId,
        }),
      );
    },
    [
      controls,
      catalogs,
      dispatch,
      allNetworkOptions,
      selectableNetworkSummaries,
    ],
  );

  const handleAddView = useCallback(() => {
    if (!controls.selectedCompoundId) return;

    const summary = selectableNetworkSummaries.find(
      (item) => item.compoundId === controls.selectedCompoundId,
    );
    if (!summary) return;

    void dispatch(
      addNetworkViewAndFormat({
        type: controls.viewType,
        compoundId: summary.compoundId,
        label: buildNetworkSummaryLabel(summary, catalogs),
        measureId: summary.measureId,
        statId: summary.statId,
      }),
    );
  }, [
    controls.selectedCompoundId,
    controls.viewType,
    catalogs,
    dispatch,
    selectableNetworkSummaries,
  ]);

  return {
    controls,
    status,
    error,
    measures,
    populations: populationOptions,
    layers: layerOptions,
    stats: statOptions,
    networks: allNetworkOptions,
    disabled: {
      measures: !controls.populationKey,
      stats: !controls.measureId,
      layers: !controls.statId,
    },
    onPopulationChange: handlePopulationChange,
    onMeasureChange: handleMeasureChange,
    onStatChange: handleStatChange,
    onLayerChange: handleLayerChange,
    onNetworkChange: handleNetworkChange,
    onAddView: handleAddView,
  };
};
