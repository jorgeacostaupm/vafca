import { buildLabelState } from "@/components/selectors/labelSelection";
import { getZoomState } from "@/components/selectors/useViewSettingsState";
import {
  toMatrixStatFilter,
  toNodeLinkStatFilter,
} from "@/components/network/networkFormatting";
import { buildCanonicalMatrixData } from "@/components/network/networkViewAdapters";
import { DEFAULT_LINK_WIDTH_RANGE } from "@/utils/matrixViewUtils";
import { resolveMatrixUiRange } from "@/utils/matrixUiRange";
import { buildCircularCategoryOrderKey } from "@/utils/circular/hierarchy";
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";
import { getDatasetCatalogs } from "@/utils/datasetAccessors";
import type { DatasetMeta } from "@/types/datasetState";
import type {
  ComputedView,
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";
import type { RoiGroup, UiRangeMode } from "@/types/connectivityBundle";
import type { StatRangeValue } from "@/types/matrixView";
import type { StoredMatrix } from "@/types/matrixStore";

type ViewSettings =
  | MatrixNetworkViewSettings
  | NodeLinkNetworkViewSettings
  | undefined;

type ResolveComputedNetworkViewArgs = {
  view: NetworkViewDescriptor;
  matrix: StoredMatrix;
  settings: ViewSettings;
  nodeLinkSettings?: NodeLinkNetworkViewSettings;
  matrixOrderIds: string[];
  atlasOrderLength: number;
  activeLabelIds: string[];
  matrixActiveLabelIds: string[];
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyCategoryOrder: Record<string, string[]>;
  dataset: DatasetMeta | null;
  uiRangeMode: UiRangeMode;
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

export const resolveComputedNetworkView = ({
  view,
  matrix,
  settings,
  nodeLinkSettings,
  matrixOrderIds,
  atlasOrderLength,
  activeLabelIds,
  matrixActiveLabelIds,
  circularHierarchyCategoryOrder,
  matrixHierarchyCategoryOrder,
  dataset,
  uiRangeMode,
}: ResolveComputedNetworkViewArgs): ComputedView => {
  const catalogs = getDatasetCatalogs(dataset);
  const sourceMatrix = dataset?.content?.matrixIndex[matrix.id] ?? matrix;
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
  const zoomState = getZoomState(settings);
  const viewActiveLabelIds =
    view.type === "matrix" ? matrixActiveLabelIds : activeLabelIds;
  const viewMatrixOrderIds = storedReducedLabels ?? matrixOrderIds;
  const activeIdsForView = orderedReducedLabels ?? viewActiveLabelIds;
  const labelState = buildLabelState({
    matrixOrderIds: viewMatrixOrderIds,
    atlasOrderLength: storedReducedLabels
      ? storedReducedLabels.length
      : atlasOrderLength,
    activeLabelIds: activeIdsForView,
    labels: settings?.labels,
    zoomLabelSelection: settings?.zoomLabelSelection,
    zoomSelection: zoomState.current,
  });
  const statFilter =
    view.type === "matrix"
      ? toMatrixStatFilter(settings?.statRange)
      : toNodeLinkStatFilter(settings?.statRange);
  const sliderRange = resolveMatrixUiRange(sourceMatrix, catalogs, {
    uiRangeMode,
    target: "slider",
  });
  const measureBounds: [number, number] = [sliderRange.min, sliderRange.max];
  const canonical = buildCanonicalMatrixData({
    matrixData: matrix.data,
    labels: labelState.labels,
    rowLabelSelection: labelState.rowLabelSelection,
    colLabelSelection: labelState.colLabelSelection,
    hideIsolatedNodes: false,
  });

  return {
    view,
    data: canonical.data,
    rowLabels: canonical.rowLabels,
    colLabels: canonical.colLabels,
    settings,
    zoomState,
    availableLabels: labelState.availableLabels,
    selectedLabels: labelState.selectedLabels,
    zoomLabelSelection: labelState.zoomLabelSelection,
    orderedZoomLabels: labelState.orderedZoomLabels,
    statFilter,
    measureRange: null,
    hideIsolatedNodes: settings?.hideIsolatedNodes ?? true,
    brushEnabled: settings?.brushEnabled ?? false,
    geometricZoomEnabled: nodeLinkSettings?.geometricZoomEnabled ?? false,
    linkWidthRange: nodeLinkSettings?.linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE,
    circularLinkTension:
      nodeLinkSettings?.circularLinkTension ?? DEFAULT_CIRCULAR_LINK_TENSION,
    circularBundlingEnabled:
      nodeLinkSettings?.circularBundlingEnabled ??
      DEFAULT_CIRCULAR_BUNDLING_ENABLED,
    useAsNodeFilter: settings?.useAsNodeFilter ?? false,
    useAsLinkFilter: settings?.useAsLinkFilter ?? false,
    isRangeFilterSource:
      Boolean(settings?.useAsNodeFilter) || Boolean(settings?.useAsLinkFilter),
    statSliderMin: measureBounds[0],
    statSliderMax: measureBounds[1],
    hasNegativeRange: measureBounds[0] < 0 && measureBounds[1] > 0,
    uiRangeMode,
    statRangeValue: settings?.statRange ?? buildRangeFallback(measureBounds),
  };
};
