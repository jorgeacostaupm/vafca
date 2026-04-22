import { useMemo } from "react";
import { buildLabelState } from "@/components/selectors/labelSelection";
import { getZoomState } from "@/components/selectors/useViewSettingsState";
import { DEFAULT_LINK_WIDTH_RANGE } from "@/utils/matrixViewUtils";
import { filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";
import {
  collectVisibleGraph,
  toMatrixStatFilter,
  toNodeLinkStatFilter,
  type FilterContributor,
  type ViewVisibility,
} from "@/components/network/networkFormatting";
import { buildCanonicalMatrixData } from "@/components/network/networkViewAdapters";
import type {
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";
import type { ComputedView } from "@/components/network/networkSelectorTypes";

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
  matrixShape: import("@/utils/matrixValue").MatrixShape;
  dataset: import("@/store/slices/datasetSlice").DatasetState["data"];
  defaultMeasureRanges: Record<string, [number, number]>;
  defaultStatRanges: Record<string, import("@/types/matrixView").StatRangeValue>;
};

export const useComputedNetworkViews = ({
  views,
  matrixByCompoundId,
  matrixSettingsByViewId,
  nodeLinkSettingsByViewId,
  matrixOrderIds,
  atlasOrderLength,
  activeLabelIds,
  matrixShape,
  dataset,
  defaultMeasureRanges,
  defaultStatRanges,
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
        activeLabelIds,
        labels: settings?.labels,
        zoomLabelSelection: settings?.zoomLabelSelection,
        zoomSelection,
      });

      const statFilter =
        view.type === "matrix"
          ? toMatrixStatFilter(settings?.statRange)
          : toNodeLinkStatFilter(settings?.statRange);
      const measureRange = settings?.measureRange ?? null;
      const hideIsolatedNodes = settings?.hideIsolatedNodes ?? true;

      const canonical = buildCanonicalMatrixData({
        matrixData: matrix.data,
        labels,
        rowLabelSelection,
        colLabelSelection,
        matrixShape,
        hideIsolatedNodes: false,
      });

      const stat = dataset?.catalogs.stats[view.statId];
      const statMin = Number.isFinite(stat?.min) ? (stat?.min as number) : -1;
      const statMax = Number.isFinite(stat?.max) ? (stat?.max as number) : 1;
      const [statSliderMin, statSliderMax] =
        statMin <= statMax ? [statMin, statMax] : [statMax, statMin];

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
        measureRange,
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
        hasNegativeRange: statSliderMin < 0 && statSliderMax > 0,
        measureRangeBounds: defaultMeasureRanges[view.measureId],
        measureRangeValue:
          settings?.measureRange ?? defaultMeasureRanges[view.measureId],
        statRangeValue: settings?.statRange ?? defaultStatRanges[view.statId],
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
    matrixShape,
    dataset,
    defaultMeasureRanges,
    defaultStatRanges,
  ]);

  const visibilityByViewId = useMemo(() => {
    const result: Record<string, ViewVisibility> = {};

    Object.values(computedByViewId).forEach((computed) => {
      const valueFilters = {
        measure: computed.measureRange,
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
