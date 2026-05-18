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
import type { NetworkViewType } from "@/types/networkVisualization";

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
    bandOptions,
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
    bandId: controls.bandId,
  });

  useNetworkViewLifecycle({
    matches,
    summariesStatus: status,
    summaries,
  });

  const handleViewTypeChange = useCallback(
    (viewType: NetworkViewType) => {
      dispatch(patchNetworkControls({ viewType }));
    },
    [dispatch],
  );

  const handlePopulationChange = useCallback(
    (value?: string) => {
      dispatch(
        patchNetworkControls({
          populationKey: value ?? "",
          measureId: "",
          statId: "",
          bandId: "",
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
          bandId: "",
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
          bandId: "",
        }),
      );
    },
    [dispatch],
  );

  const handleBandChange = useCallback(
    (value?: string) => {
      dispatch(patchNetworkControls({ bandId: value ?? "" }));
    },
    [dispatch],
  );

  const handleMatrixChange = useCallback(
    (value?: string) => {
      if (!value) {
        dispatch(patchNetworkControls({ selectedCompoundId: "" }));
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
          bandId: summary.bandId,
          selectedCompoundId: summary.compoundId,
        }),
      );
    },
    [dispatch, selectableMatrixSummaries],
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
    bands: bandOptions,
    stats: statOptions,
    matrices: allMatrixOptions,
    disabled: {
      measures: !controls.populationKey,
      stats: !controls.measureId,
      bands: !controls.statId,
    },
    onViewTypeChange: handleViewTypeChange,
    onPopulationChange: handlePopulationChange,
    onMeasureChange: handleMeasureChange,
    onStatChange: handleStatChange,
    onBandChange: handleBandChange,
    onMatrixChange: handleMatrixChange,
    onAddView: handleAddView,
  };
};
