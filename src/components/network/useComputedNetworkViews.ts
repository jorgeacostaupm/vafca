import { useMemo } from "react";
import { buildLabelState } from "@/components/selectors/labelSelection";
import { getZoomState } from "@/components/selectors/useViewSettingsState";
import { DEFAULT_LINK_WIDTH_RANGE } from "@/utils/matrixViewUtils";
import { filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";
import {
  collectVisibleGraph,
  toMatrixStatFilter,
  toNodeLinkStatFilter,
} from "@/components/network/networkFormatting";
import { buildCanonicalMatrixData } from "@/components/network/networkViewAdapters";
import type {
  ComputedView,
  FilterContributor,
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
  ViewVisibility,
} from "@/types/networkVisualization";
import type { MatrixShape } from "@/types/matrix";
import type { StatRangeValue } from "@/types/matrixView";

type UseComputedNetworkViewsArgs = {
  views: NetworkViewDescriptor[];
  matrixByCompoundId: Record<
    string,
    | Exclude<
        Awaited<ReturnType<typeof import("@/utils/matrixStore").getMatrix>>,
        undefined
      >
    | null
  >;
  matrixSettingsByViewId: Record<string, MatrixNetworkViewSettings>;
  nodeLinkSettingsByViewId: Record<string, NodeLinkNetworkViewSettings>;
  matrixOrderIds: string[];
  atlasOrderLength: number;
  activeLabelIds: string[];
  matrixActiveLabelIds: string[];
  matrixShape: MatrixShape;
  defaultMeasureRanges: Record<string, [number, number]>;
};

const buildRangeFallback = (
  bounds?: [number, number],
): StatRangeValue | undefined => {
  if (!bounds) return undefined;
  const [min, max] = bounds;
  if (min < 0 && max > 0) {
    return {
      negative: [min, 0],
      positive: [0, max],
    };
  }
  return [min, max];
};

export const useComputedNetworkViews = ({
  views,
  matrixByCompoundId,
  matrixSettingsByViewId,
  nodeLinkSettingsByViewId,
  matrixOrderIds,
  atlasOrderLength,
  activeLabelIds,
  matrixActiveLabelIds,
  matrixShape,
  defaultMeasureRanges,
}: UseComputedNetworkViewsArgs) => {
  const computedByViewId = useMemo(() => {
    const map: Record<string, ComputedView> = {};

    views.forEach((view) => {
      const matrix = matrixByCompoundId[view.compoundId];
      if (!matrix) return;

      const settings =
        view.type === "matrix"
          ? matrixSettingsByViewId[view.id]
          : nodeLinkSettingsByViewId[view.id];
      const nodeLinkSettings =
        view.type === "matrix" ? undefined : nodeLinkSettingsByViewId[view.id];
      const zoomState = getZoomState(settings);
      const zoomSelection = zoomState.current;
      const viewActiveLabelIds =
        view.type === "matrix" ? matrixActiveLabelIds : activeLabelIds;
      const {
        labels,
        rowLabelSelection,
        colLabelSelection,
        availableLabels,
        selectedLabels,
        zoomLabelSelection,
        orderedZoomLabels,
      } = buildLabelState({
        matrixOrderIds,
        atlasOrderLength,
        activeLabelIds: viewActiveLabelIds,
        labels: settings?.labels,
        zoomLabelSelection: settings?.zoomLabelSelection,
        zoomSelection,
      });

      const statFilter =
        view.type === "matrix"
          ? toMatrixStatFilter(settings?.statRange)
          : toNodeLinkStatFilter(settings?.statRange);
      const measureBounds = defaultMeasureRanges[view.measureId];
      const [statSliderMin, statSliderMax] = measureBounds ?? [-1, 1];
      const hasNegativeRange = statSliderMin < 0 && statSliderMax > 0;
      const rangeFallback = buildRangeFallback(measureBounds);
      const statRangeValue = settings?.statRange ?? rangeFallback;
      const hideIsolatedNodes = settings?.hideIsolatedNodes ?? true;

      const canonical = buildCanonicalMatrixData({
        matrixData: matrix.data,
        labels,
        rowLabelSelection,
        colLabelSelection,
        matrixShape,
        hideIsolatedNodes: false,
      });

      map[view.id] = {
        view,
        data: canonical.data,
        rowLabels: canonical.rowLabels,
        colLabels: canonical.colLabels,
        settings,
        zoomState,
        availableLabels,
        selectedLabels,
        zoomLabelSelection,
        orderedZoomLabels,
        statFilter,
        measureRange: null,
        hideIsolatedNodes,
        brushEnabled: settings?.brushEnabled ?? false,
        geometricZoomEnabled: nodeLinkSettings?.geometricZoomEnabled ?? false,
        linkWidthRange:
          nodeLinkSettings?.linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE,
        useAsNodeFilter: settings?.useAsNodeFilter ?? false,
        nodeFilterMode: settings?.nodeFilterMode ?? "or",
        useAsLinkFilter: settings?.useAsLinkFilter ?? false,
        linkFilterMode: settings?.linkFilterMode ?? "or",
        statSliderMin,
        statSliderMax,
        hasNegativeRange,
        statRangeValue,
      };
    });

    return map;
  }, [
    views,
    matrixByCompoundId,
    matrixSettingsByViewId,
    nodeLinkSettingsByViewId,
    matrixOrderIds,
    atlasOrderLength,
    activeLabelIds,
    matrixActiveLabelIds,
    matrixShape,
    defaultMeasureRanges,
  ]);

  const visibilityByViewId = useMemo(() => {
    const result: Record<string, ViewVisibility> = {};

    Object.values(computedByViewId).forEach((computed) => {
      const valueFilters = {
        measure: null,
        stat: computed.statFilter,
      };

      if (computed.view.type === "matrix") {
        const rendered = computed.hideIsolatedNodes
          ? filterIsolatedMatrixEntries(
              computed.data,
              computed.rowLabels,
              computed.colLabels,
              valueFilters,
            )
          : {
              data: computed.data,
              rowLabels: computed.rowLabels,
              colLabels: computed.colLabels,
            };

        result[computed.view.id] = collectVisibleGraph({
          data: rendered.data,
          rowLabels: rendered.rowLabels ?? [],
          colLabels: rendered.colLabels ?? [],
          includeIsolatedNodes: !computed.hideIsolatedNodes,
          valueFilters,
        });
        return;
      }

      result[computed.view.id] = collectVisibleGraph({
        data: computed.data,
        rowLabels: computed.rowLabels,
        colLabels: computed.rowLabels,
        includeIsolatedNodes: !computed.hideIsolatedNodes,
        valueFilters,
      });
    });

    return result;
  }, [computedByViewId]);

  const nodeFilterContributors = useMemo(
    () =>
      Object.values(computedByViewId)
        .filter((computed) => computed.useAsNodeFilter)
        .map(
          (computed) =>
            ({
              viewId: computed.view.id,
              mode: computed.nodeFilterMode,
            }) as FilterContributor,
        ),
    [computedByViewId],
  );

  const linkFilterContributors = useMemo(
    () =>
      Object.values(computedByViewId)
        .filter((computed) => computed.useAsLinkFilter)
        .map(
          (computed) =>
            ({
              viewId: computed.view.id,
              mode: computed.linkFilterMode,
            }) as FilterContributor,
        ),
    [computedByViewId],
  );

  return {
    computedByViewId,
    visibilityByViewId,
    nodeFilterContributors,
    linkFilterContributors,
  };
};
