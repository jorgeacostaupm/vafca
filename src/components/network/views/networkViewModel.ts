import {
  toMatrixStatFilter,
  toNodeLinkStatFilter,
} from "@/components/network/networkFormatting";
import { buildCanonicalMatrixData } from "@/components/network/networkViewRenderData";
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
import type { DatasetMeta } from "@/types/datasetState";
import type { NodeGroup, UiRangeMode } from "@/types/network";
import type { StoredNetworkView } from "@/types/networkViewStore";
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
  networkView: StoredNetworkView;
  settings: ViewSettings;
  nodeLinkSettings?: NodeLinkNetworkViewSettings;
  nodeOrderIds: string[];
  atlasOrderLength: number;
  activeLabelIds: string[];
  matrixViewActiveLabelIds: string[];
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyCategoryOrder: Record<string, string[]>;
  dataset: DatasetMeta | null;
  uiRangeMode: UiRangeMode;
};

const sortAggregatedGroupsByCategoryOrder = (
  groups: NodeGroup[],
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
  networkView,
  settings,
  nodeLinkSettings,
  nodeOrderIds,
  atlasOrderLength,
  activeLabelIds,
  matrixViewActiveLabelIds,
  circularHierarchyCategoryOrder,
  matrixHierarchyCategoryOrder,
  dataset,
  uiRangeMode,
}: ResolveComputedNetworkViewArgs): ComputedView => {
  const catalogs = getDatasetCatalogs(dataset);
  const sourceNetwork = dataset?.content?.networkIndex[networkView.id];
  const sourceSymmetric = sourceNetwork
    ? sourceNetwork.data.format === "matrix"
      ? sourceNetwork.data.symmetric
      : !sourceNetwork.data.directed
    : networkView.symmetric;
  const matrixSettings =
    view.type === "matrix" ? (settings as MatrixNetworkViewSettings | undefined) : undefined;
  const storedAggregatedLabels =
    sourceNetwork?.derivation?.type === "aggregation"
      ? sourceNetwork.nodeIds
      : null;
  const orderedAggregatedLabels =
    sourceNetwork?.derivation?.type === "aggregation"
      ? sortAggregatedGroupsByCategoryOrder(
          sourceNetwork.derivation.groups,
          sourceNetwork.derivation.fields,
          view.type === "matrix"
            ? matrixHierarchyCategoryOrder
            : circularHierarchyCategoryOrder,
        ).map((group) => group.id)
      : storedAggregatedLabels;
  const zoomState = getZoomState(settings);
  const viewActiveLabelIds =
    view.type === "matrix" ? matrixViewActiveLabelIds : activeLabelIds;
  const viewNodeOrderIds = storedAggregatedLabels ?? nodeOrderIds;
  const activeIdsForView = orderedAggregatedLabels ?? viewActiveLabelIds;
  const labelState = buildLabelState({
    nodeOrderIds: viewNodeOrderIds,
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
    matrixData: networkView.data,
    labels: labelState.labels,
    rowLabelSelection: labelState.rowLabelSelection,
    colLabelSelection: labelState.colLabelSelection,
    hideIsolatedNodes: false,
  });
  const valueDomain = resolveValueDomain({
    network: sourceNetwork ?? networkView,
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
