import { useMemo } from "react";
import { buildLabelState } from "@/components/selectors/labelSelection";
import { getZoomState } from "@/components/selectors/useViewSettingsState";
import { DEFAULT_LINK_WIDTH_RANGE } from "@/utils/matrixViewUtils";
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";
import { filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";
import { resolveMatrixUiRange } from "@/utils/matrixUiRange";
import { buildCircularCategoryOrderKey } from "@/utils/circular/hierarchy";
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
import type { StatRangeValue } from "@/types/matrixView";
import type { DatasetMeta } from "@/types/datasetState";
import type { RoiGroup, UiRangeMode } from "@/types/connectivityBundle";

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
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyCategoryOrder: Record<string, string[]>;
  dataset: DatasetMeta | null;
  uiRangeMode: UiRangeMode;
  includeDiagonalInRanges: boolean;
};

const sortReducedGroupsByCategoryOrder = (
  groups: RoiGroup[],
  fields: string[],
  categoryOrder: Record<string, string[]>,
) =>
  [...groups].sort((a, b) => {
    const parentValues: string[] = [];

    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      const orderKey = buildCircularCategoryOrderKey(index, parentValues);
      const configuredOrder = categoryOrder[orderKey] ?? [];
      const aValue = a.criteria[field] ?? "Unknown";
      const bValue = b.criteria[field] ?? "Unknown";
      const aIndex = configuredOrder.indexOf(aValue);
      const bIndex = configuredOrder.indexOf(bValue);

      if (aIndex !== bIndex) {
        if (aIndex < 0) return 1;
        if (bIndex < 0) return -1;
        return aIndex - bIndex;
      }

      const fallback = aValue.localeCompare(bValue, undefined, {
        sensitivity: "base",
      });
      if (fallback !== 0) return fallback;
      parentValues.push(aValue);
    }

    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });

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
  circularHierarchyCategoryOrder,
  matrixHierarchyCategoryOrder,
  dataset,
  uiRangeMode,
  includeDiagonalInRanges,
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
      const sourceMatrix =
        dataset?.connectivity?.matrixIndex[matrix.id] ?? matrix;
      const storedReducedLabels =
        "kind" in sourceMatrix &&
        sourceMatrix.kind === "reduced" &&
        sourceMatrix.geometry.roiOrder
          ? sourceMatrix.geometry.roiOrder
          : null;
      const orderedReducedLabels =
        "kind" in sourceMatrix &&
        sourceMatrix.kind === "reduced" &&
        sourceMatrix.reduction
          ? sortReducedGroupsByCategoryOrder(
              sourceMatrix.reduction.groups,
              sourceMatrix.reduction.fields,
              view.type === "matrix"
                ? matrixHierarchyCategoryOrder
                : circularHierarchyCategoryOrder,
            ).map((group) => group.id)
          : storedReducedLabels;
      const nodeLinkSettings =
        view.type === "matrix" ? undefined : nodeLinkSettingsByViewId[view.id];
      const zoomState = getZoomState(settings);
      const zoomSelection = zoomState.current;
      const viewActiveLabelIds =
        view.type === "matrix" ? matrixActiveLabelIds : activeLabelIds;
      const viewMatrixOrderIds = storedReducedLabels ?? matrixOrderIds;
      const activeIdsForView = orderedReducedLabels ?? viewActiveLabelIds;
      const {
        labels,
        rowLabelSelection,
        colLabelSelection,
        availableLabels,
        selectedLabels,
        zoomLabelSelection,
        orderedZoomLabels,
      } = buildLabelState({
        matrixOrderIds: viewMatrixOrderIds,
        atlasOrderLength: storedReducedLabels ? storedReducedLabels.length : atlasOrderLength,
        activeLabelIds: activeIdsForView,
        labels: settings?.labels,
        zoomLabelSelection: settings?.zoomLabelSelection,
        zoomSelection,
      });

      const statFilter =
        view.type === "matrix"
          ? toMatrixStatFilter(settings?.statRange)
          : toNodeLinkStatFilter(settings?.statRange);
      const sliderRange = resolveMatrixUiRange(sourceMatrix, dataset?.catalogs, {
        uiRangeMode,
        includeDiagonal: includeDiagonalInRanges,
        target: "slider",
      });
      const measureBounds: [number, number] = [sliderRange.min, sliderRange.max];
      const [statSliderMin, statSliderMax] = measureBounds;
      const hasNegativeRange = statSliderMin < 0 && statSliderMax > 0;
      const rangeFallback = buildRangeFallback(measureBounds);
      const statRangeValue = settings?.statRange ?? rangeFallback;
      const hideIsolatedNodes = settings?.hideIsolatedNodes ?? true;

      const canonical = buildCanonicalMatrixData({
        matrixData: matrix.data,
        labels,
        rowLabelSelection,
        colLabelSelection,
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
        circularLinkTension:
          nodeLinkSettings?.circularLinkTension ?? DEFAULT_CIRCULAR_LINK_TENSION,
        circularBundlingEnabled:
          nodeLinkSettings?.circularBundlingEnabled ??
          DEFAULT_CIRCULAR_BUNDLING_ENABLED,
        useAsNodeFilter: settings?.useAsNodeFilter ?? false,
        useAsLinkFilter: settings?.useAsLinkFilter ?? false,
        isRangeFilterSource:
          Boolean(settings?.useAsNodeFilter) || Boolean(settings?.useAsLinkFilter),
        statSliderMin,
        statSliderMax,
        hasNegativeRange,
        uiRangeMode,
        includeDiagonalInRanges,
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
    circularHierarchyCategoryOrder,
    matrixHierarchyCategoryOrder,
    dataset,
    uiRangeMode,
    includeDiagonalInRanges,
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

  const activeFilterSource = useMemo(
    () =>
      Object.values(computedByViewId).find(
        (computed) => computed.isRangeFilterSource,
      ),
    [computedByViewId],
  );

  const nodeFilterContributors = useMemo<FilterContributor[]>(
    () =>
      activeFilterSource?.useAsNodeFilter
        ? [{ viewId: activeFilterSource.view.id }]
        : [],
    [activeFilterSource],
  );

  const linkFilterContributors = useMemo<FilterContributor[]>(
    () =>
      activeFilterSource?.useAsLinkFilter
        ? [{ viewId: activeFilterSource.view.id }]
        : [],
    [activeFilterSource],
  );

  return {
    computedByViewId,
    visibilityByViewId,
    nodeFilterContributors,
    linkFilterContributors,
  };
};
