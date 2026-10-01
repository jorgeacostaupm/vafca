import { useCallback } from "react";

import { useNetworkViewLifecycle } from "@/components/network/useNetworkViewLifecycle";
import { reconcileNetworkFilters } from "@/components/selectors/reconcileNetworkFilters";
import { useNetworkFilterOptions } from "@/components/selectors/useNetworkFilterOptions";
import { useDatasetNetworkSummaries } from "@/hooks/useDatasetNetworkSummaries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  addNetworkViewAndFormat,
  patchNetworkControls,
} from "@/store/slices/networkVisualization";
import {
  getDatasetCatalogs,
} from "@/utils/datasetAccessors";
import { buildNetworkSummaryLabel } from "@/utils/matrixViewUtils";

export const useNetworkSelectorModel = () => {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const catalogs = getDatasetCatalogs(dataset);
  const atlas = useAppSelector((state) => state.atlasUi);
  const controls = useAppSelector((state) => state.networkVisualization.controls);
  const { summaries, status, error } = useDatasetNetworkSummaries();

  const {
    sourceOptions,
    measures,
    statisticOptions,
    aspectOptions,
    matches,
    allNetworkOptions,
    selectableNetworkSummaries,
  } = useNetworkFilterOptions({
    dataset,
    atlas,
    summaries,
    sourceId: controls.sourceId,
    measureId: controls.measureId,
    statisticId: controls.statisticId,
    aspectFilters: controls.aspectFilters,
  });

  useNetworkViewLifecycle({
    matches,
    summariesStatus: status,
    summaries,
  });

  const handleFilterChange = useCallback(
    (patch: Partial<typeof controls>) => {
      dispatch(patchNetworkControls({
        ...reconcileNetworkFilters(
          { ...controls, ...patch },
          selectableNetworkSummaries,
          aspectOptions.map((aspect) => aspect.id),
        ),
        selectedCompoundId: "",
      }));
    },
    [controls, dispatch, selectableNetworkSummaries, aspectOptions],
  );

  const handleSourceChange = (value?: string) =>
    handleFilterChange({ sourceId: value ?? "" });
  const handleMeasureChange = (value?: string) =>
    handleFilterChange({ measureId: value ?? "" });
  const handleStatisticChange = (value?: string) =>
    handleFilterChange({ statisticId: value ?? "" });
  const handleAspectChange = (aspectId: string, value?: string) =>
    handleFilterChange({
      aspectFilters: { ...controls.aspectFilters, [aspectId]: value ?? "" },
    });

  const handleNetworkChange = useCallback(
    (value?: string) => {
      if (!value) {
        const shouldClearFields = controls.matrixSelectorMode === "combined";
        dispatch(
          patchNetworkControls({
            sourceId: shouldClearFields ? "" : controls.sourceId,
            measureId: shouldClearFields ? "" : controls.measureId,
            statisticId: shouldClearFields ? "" : controls.statisticId,
            aspectFilters: shouldClearFields ? {} : controls.aspectFilters,
            selectedCompoundId: "",
          }),
        );
        return;
      }

      const summary = selectableNetworkSummaries.find(
        (item) => item.compoundId === value,
      );
      if (!summary) {
        dispatch(patchNetworkControls({ selectedCompoundId: "" }));
        return;
      }

      dispatch(
        patchNetworkControls({
          sourceId: summary.sourceId,
          measureId: summary.measureId,
          statisticId: summary.statisticId,
          aspectFilters: summary.dimensions,
          selectedCompoundId: summary.compoundId,
        }),
      );
    },
    [
      controls,
      dispatch,
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
        statisticId: summary.statisticId,
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
    sources: sourceOptions,
    aspects: aspectOptions,
    statistics: statisticOptions,
    networks: allNetworkOptions,
    labels: {
      source: catalogs?.core.source.label ?? "Source",
      measure: catalogs?.core.measure.label ?? "Measure",
      statistic: catalogs?.core.statistic.label ?? "Statistic",
    },
    disabled: {
      measures: !controls.sourceId,
      stats: !controls.measureId,
      aspects: !controls.statisticId,
    },
    onSourceChange: handleSourceChange,
    onMeasureChange: handleMeasureChange,
    onStatisticChange: handleStatisticChange,
    onAspectChange: handleAspectChange,
    onNetworkChange: handleNetworkChange,
    onAddView: handleAddView,
  };
};
