import { useCallback, useEffect } from "react";

import { useNetworkFilterOptions } from "@/components/selectors/useNetworkFilterOptions";
import { useNetworkSummaries } from "@/hooks/useNetworkSummaries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  patchNetworkSummaryControls,
  selectNetworkSummaryControls,
} from "@/store/slices/networkMeasures";
import { selectNetworkControls } from "@/store/slices/networkVisualization";
import {
  getDatasetNetworkStats,
} from "@/utils/datasetAccessors";
import { normalizePopulationKey } from "@/utils/matrixViewUtils";

export const useNetworkSummarySelectorModel = () => {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const networkControls = useAppSelector(selectNetworkControls);
  const controls = useAppSelector(selectNetworkSummaryControls);
  const networkStats = getDatasetNetworkStats(dataset);
  const { summaries, status, error } = useNetworkSummaries(networkStats.total);
  const effectiveSelectorMode = networkControls.matrixSelectorMode;

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

  useEffect(() => {
    if (controls.matrixSelectorMode === effectiveSelectorMode) return;
    dispatch(
      patchNetworkSummaryControls({
        matrixSelectorMode: effectiveSelectorMode,
      }),
    );
  }, [controls.matrixSelectorMode, dispatch, effectiveSelectorMode]);

  useEffect(() => {
    if (effectiveSelectorMode !== "fields") return;
    const fieldsComplete =
      controls.populationKey &&
      controls.measureId &&
      controls.statId &&
      controls.layerId;
    if (!fieldsComplete) return;
    if (matches.length !== 1) return;
    const [match] = matches;
    if (controls.selectedCompoundId === match.compoundId) return;
    dispatch(
      patchNetworkSummaryControls({
        selectedCompoundId: match.compoundId,
      }),
    );
  }, [
    controls.layerId,
    controls.measureId,
    controls.populationKey,
    controls.selectedCompoundId,
    controls.statId,
    dispatch,
    effectiveSelectorMode,
    matches,
  ]);

  const handlePopulationChange = useCallback(
    (value?: string) => {
      dispatch(
        patchNetworkSummaryControls({
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
        patchNetworkSummaryControls({
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
        patchNetworkSummaryControls({
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
        patchNetworkSummaryControls({
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
        dispatch(
          patchNetworkSummaryControls({
            populationKey: "",
            measureId: "",
            statId: "",
            layerId: "",
            selectedCompoundId: "",
          }),
        );
        return;
      }

      const summary = selectableNetworkSummaries.find(
        (item) => item.compoundId === value,
      );
      if (!summary) {
        dispatch(patchNetworkSummaryControls({ selectedCompoundId: "" }));
        return;
      }

      dispatch(
        patchNetworkSummaryControls({
          populationKey: normalizePopulationKey(summary.populationIds),
          measureId: summary.measureId,
          statId: summary.statId,
          layerId: summary.layerId,
          selectedCompoundId: summary.compoundId,
        }),
      );
    },
    [dispatch, selectableNetworkSummaries],
  );

  return {
    controls: {
      ...controls,
      matrixSelectorMode: effectiveSelectorMode,
    },
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
  };
};
