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
import type { AtlasDefinition } from "@/types/atlas";
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";
import type { MaterializedNetworkView } from "@/types/datasetNetworkView";
import type { DatasetMeta } from "@/types/datasetState";
import type { NodeGroup, UiRangeMode } from "@/types/network";
import type {
  ComputedView,
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";
import { buildAggregatedAtlasNodes } from "@/utils/aggregatedNodePresentation";
import { getDatasetCatalogs } from "@/utils/datasetAccessors";
import { orderAtlasLabels } from "@/utils/orderAtlasLabels";
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
  networkView: MaterializedNetworkView;
  settings: ViewSettings;
  nodeLinkSettings?: NodeLinkNetworkViewSettings;
  nodeOrderIds: string[];
  atlasOrderLength: number;
  activeLabelIds: string[];
  matrixViewActiveLabelIds: string[];
  temporaryGroups?: NodeGroup[];
  orderingAtlasDefinition?: AtlasDefinition | null;
  matrixHierarchyFields?: string[];
  circularHierarchyFields?: string[];
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyCategoryOrder: Record<string, string[]>;
  dataset: DatasetMeta | null;
  uiRangeMode: UiRangeMode;
  selectedNodeIds?: string[];
};

export const resolveComputedNetworkView = ({
  view,
  networkView,
  settings,
  nodeLinkSettings,
  nodeOrderIds,
  atlasOrderLength,
  activeLabelIds,
  matrixViewActiveLabelIds,
  temporaryGroups,
  orderingAtlasDefinition = null,
  matrixHierarchyFields = [],
  circularHierarchyFields = [],
  circularHierarchyCategoryOrder,
  matrixHierarchyCategoryOrder,
  dataset,
  uiRangeMode,
  selectedNodeIds,
}: ResolveComputedNetworkViewArgs): ComputedView => {
  const catalogs = getDatasetCatalogs(dataset);
  const sourceNetwork = dataset?.content?.networkIndex[networkView.id];
  const sourceSymmetric = sourceNetwork ? true : networkView.symmetric;
  const matrixSettings =
    view.type === "matrix" ? (settings as MatrixNetworkViewSettings | undefined) : undefined;
  const storedAggregatedLabels =
    sourceNetwork?.derivation?.type === "aggregation"
      ? sourceNetwork.nodeIds
      : view.temporaryNetworkId
        ? networkView.nodeIds
        : null;
  const groups = sourceNetwork?.derivation?.type === 'aggregation' ? sourceNetwork.derivation.groups : temporaryGroups;
  if (groups && orderingAtlasDefinition) {
    const groupIds = new Set(groups.map(group => group.id));
    orderingAtlasDefinition = { ...orderingAtlasDefinition, nodes: [
      ...orderingAtlasDefinition.nodes.filter(node => !groupIds.has(node.id)),
      ...buildAggregatedAtlasNodes(groups, orderingAtlasDefinition, [...new Set([...matrixHierarchyFields, ...circularHierarchyFields])]),
    ] };
  }
  const orderedAggregatedLabels = storedAggregatedLabels
    ? orderAtlasLabels(storedAggregatedLabels, orderingAtlasDefinition,
        view.type === 'matrix' ? matrixHierarchyFields : view.type === 'circular' ? circularHierarchyFields : [],
        view.type === 'matrix' ? matrixHierarchyCategoryOrder : circularHierarchyCategoryOrder)
    : null;
  const zoomState = getZoomState(settings);
  const viewActiveLabelIds =
    view.type === "matrix" ? matrixViewActiveLabelIds : activeLabelIds;
  const viewNodeOrderIds = storedAggregatedLabels ?? networkView.nodeIds ?? nodeOrderIds;
  const viewNodeIds = new Set(viewNodeOrderIds);
  const activeIdsForView = orderedAggregatedLabels ??
    viewActiveLabelIds.filter((id) => viewNodeIds.has(id));
  const labelState = buildLabelState({
    nodeOrderIds: viewNodeOrderIds,
    atlasOrderLength: storedAggregatedLabels
      ? storedAggregatedLabels.length
      : atlasOrderLength,
    activeLabelIds: activeIdsForView,
    labels: settings?.labels,
    zoomLabelSelection: selectedNodeIds ?? [],
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
  });

  return {
    orderingAtlasDefinition,
    view,
    inputMatrix: {
      data: networkView.data,
      rowLabels: viewNodeOrderIds,
      colLabels: viewNodeOrderIds,
    },
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
    percentLinkFilter: settings?.percentLinkFilter ?? null,
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
