import {
  toMatrixStatFilter,
  toNodeLinkStatFilter,
} from "@/components/network/networkFormatting";
import { buildCanonicalMatrixData } from "@/components/network/networkViewAdapters";
import { buildLabelState } from "@/components/selectors/labelSelection";
import { getZoomState } from "@/components/selectors/useViewSettingsState";
import {
  DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
  DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
} from "@/config/matrixColorScales";
import {
  DEFAULT_LINK_WIDTH_RANGE,
  DEFAULT_MATRIX_BRUSH_MODE,
  DEFAULT_NETWORK_PERCENT_ZOOM_PERCENT,
  DEFAULT_NETWORK_SELECTION_VISIBLE,
} from "@/config/ui";
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";
import type { RoiGroup, UiRangeMode } from "@/types/connectivityBundle";
import type { DatasetMeta } from "@/types/datasetState";
import type { StoredMatrix } from "@/types/matrixStore";
import type {
  ComputedView,
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";
import { buildCircularCategoryOrderKey } from "@/utils/circular/hierarchy";
import { getDatasetCatalogs } from "@/utils/datasetAccessors";
import {
  buildSplitRangeFromDomain,
  resolveValueDomain,
} from "@/utils/valueDomain";

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

const sortAggregatedGroupsByCategoryOrder = (
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
  const sourceSymmetric =
    "encoding" in sourceMatrix ? sourceMatrix.encoding.symmetric : matrix.symmetric;
  const matrixSettings =
    view.type === "matrix" ? (settings as MatrixNetworkViewSettings | undefined) : undefined;
  const storedAggregatedLabels =
    "kind" in sourceMatrix &&
    sourceMatrix.kind === "aggregated" &&
    sourceMatrix.geometry.roiOrder
      ? sourceMatrix.geometry.roiOrder
      : null;
  const orderedAggregatedLabels =
    "kind" in sourceMatrix &&
    sourceMatrix.kind === "aggregated" &&
    sourceMatrix.aggregation
      ? sortAggregatedGroupsByCategoryOrder(
          sourceMatrix.aggregation.groups,
          sourceMatrix.aggregation.fields,
          view.type === "matrix"
            ? matrixHierarchyCategoryOrder
            : circularHierarchyCategoryOrder,
        ).map((group) => group.id)
      : storedAggregatedLabels;
  const zoomState = getZoomState(settings);
  const viewActiveLabelIds =
    view.type === "matrix" ? matrixActiveLabelIds : activeLabelIds;
  const viewMatrixOrderIds = storedAggregatedLabels ?? matrixOrderIds;
  const activeIdsForView = orderedAggregatedLabels ?? viewActiveLabelIds;
  const labelState = buildLabelState({
    matrixOrderIds: viewMatrixOrderIds,
    atlasOrderLength: storedAggregatedLabels
      ? storedAggregatedLabels.length
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
  const canonical = buildCanonicalMatrixData({
    matrixData: matrix.data,
    labels: labelState.labels,
    rowLabelSelection: labelState.rowLabelSelection,
    colLabelSelection: labelState.colLabelSelection,
    hideIsolatedNodes: false,
  });
  const valueDomain = resolveValueDomain({
    matrix: sourceMatrix,
    catalogs,
    mode: uiRangeMode,
    observedData: canonical.data,
  });

  return {
    view,
    data: canonical.data,
    rowLabels: canonical.rowLabels,
    colLabels: canonical.colLabels,
    symmetric: sourceSymmetric,
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
    brushMode:
      view.type === "matrix"
        ? matrixSettings?.brushMode ?? DEFAULT_MATRIX_BRUSH_MODE
        : nodeLinkSettings?.brushMode ?? DEFAULT_MATRIX_BRUSH_MODE,
    geometricZoomEnabled: nodeLinkSettings?.geometricZoomEnabled ?? false,
    linkWidthRange: nodeLinkSettings?.linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE,
    circularLinkTension:
      nodeLinkSettings?.circularLinkTension ?? DEFAULT_CIRCULAR_LINK_TENSION,
    circularBundlingEnabled:
      nodeLinkSettings?.circularBundlingEnabled ??
      DEFAULT_CIRCULAR_BUNDLING_ENABLED,
    circularPositiveLinkColor:
      nodeLinkSettings?.circularPositiveLinkColor ??
      DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR,
    circularNegativeLinkColor:
      nodeLinkSettings?.circularNegativeLinkColor ??
      DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR,
    selectionVisible:
      settings?.selectionVisible ?? DEFAULT_NETWORK_SELECTION_VISIBLE,
    zoomLinkPercent:
      settings?.zoomLinkPercent ?? DEFAULT_NETWORK_PERCENT_ZOOM_PERCENT,
    useAsNodeFilter: settings?.useAsNodeFilter ?? false,
    useAsLinkFilter: settings?.useAsLinkFilter ?? false,
    isRangeFilterSource:
      Boolean(settings?.useAsNodeFilter) || Boolean(settings?.useAsLinkFilter),
    valueDomain,
    statSliderMin: valueDomain.min,
    statSliderMax: valueDomain.max,
    hasNegativeRange:
      valueDomain.scaleType === "diverging" &&
      valueDomain.center !== null &&
      valueDomain.min < valueDomain.center &&
      valueDomain.max > valueDomain.center,
    uiRangeMode,
    statRangeValue: settings?.statRange ?? buildSplitRangeFromDomain(valueDomain),
  };
};
