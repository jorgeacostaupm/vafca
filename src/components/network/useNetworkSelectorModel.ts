import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addNetworkViewAndFormat,
  patchNetworkControls,
} from "@/store/slices/networkVisualization";
import { useMatrixSummaries } from "@/hooks/useMatrixSummaries";
import { useMatrixFilterOptions } from "@/components/selectors/useMatrixFilterOptions";
import { useNetworkViewLifecycle } from "@/components/network/useNetworkViewLifecycle";
import { buildMatrixLabel, normalizePopulationKey } from "@/utils/matrixViewUtils";

export const useNetworkSelectorModel = () => {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const controls = useAppSelector((state) => state.networkVisualization.controls);
  const { summaries, status, error } = useMatrixSummaries(dataset?.matrixStats.total);

  const {
    populationOptions,
    measures,
    statOptions,
    layerOptions,
    matches,
    allMatrixOptions,
    selectableMatrixSummaries,
  } = useMatrixFilterOptions({
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

  const handleMatrixChange = useCallback(
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

      const summary = selectableMatrixSummaries.find(
        (item) => item.compoundId === value,
      );
      if (!summary) {
        dispatch(patchNetworkControls({ selectedCompoundId: "" }));
        return;
      }

      dispatch(
        patchNetworkControls({
          populationKey: normalizePopulationKey(summary.populationIds),
          measureId: summary.measureId,
          statId: summary.statId,
          layerId: summary.layerId,
          selectedCompoundId: summary.compoundId,
        }),
      );
    },
    [
      controls.layerId,
      controls.matrixSelectorMode,
      controls.measureId,
      controls.populationKey,
      controls.statId,
      dispatch,
      selectableMatrixSummaries,
    ],
  );

  const handleAddView = useCallback(() => {
    if (!controls.selectedCompoundId) return;

    const summary = selectableMatrixSummaries.find(
      (item) => item.compoundId === controls.selectedCompoundId,
    );
    if (!summary) return;

    void dispatch(
      addNetworkViewAndFormat({
        type: controls.viewType,
        compoundId: summary.compoundId,
        label: buildMatrixLabel(summary, dataset?.catalogs),
        measureId: summary.measureId,
        statId: summary.statId,
      }),
    );
  }, [
    controls.selectedCompoundId,
    controls.viewType,
    dataset,
    dispatch,
    selectableMatrixSummaries,
  ]);

  return {
    controls,
    status,
    error,
    measures,
    populations: populationOptions,
    layers: layerOptions,
    stats: statOptions,
    matrices: allMatrixOptions,
    disabled: {
      measures: !controls.populationKey,
      stats: !controls.measureId,
      layers: !controls.statId,
    },
    onPopulationChange: handlePopulationChange,
    onMeasureChange: handleMeasureChange,
    onStatChange: handleStatChange,
    onLayerChange: handleLayerChange,
    onMatrixChange: handleMatrixChange,
    onAddView: handleAddView,
  };
};
