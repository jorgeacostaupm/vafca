import { useMemo } from "react";

import { resolveComputedNetworkView } from "@/components/network/views/networkViewModel";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import type { AtlasDefinition } from "@/types/atlas";
import type { MaterializedNetworkView } from "@/types/datasetNetworkView";
import type { DatasetMeta } from "@/types/datasetState";
import type { NodeGroup, UiRangeMode } from "@/types/network";
import type {
  ComputedView,
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";

export type NetworkViewComputationContext = {
  dataset: DatasetMeta | null;
  nodeOrderIds: string[];
  activeLabelIds: string[];
  matrixViewActiveLabelIds: string[];
  atlasOrderLength: number;
  temporaryNetworks?: Record<string, { groups: NodeGroup[] }>;
  orderingAtlasDefinition?: AtlasDefinition | null;
  matrixHierarchyFields?: string[];
  circularHierarchyFields?: string[];
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyCategoryOrder: Record<string, string[]>;
  uiRangeMode: UiRangeMode;
  selectedNodeIds?: string[];
};

export const resolveNetworkViewWithContext = ({
  view,
  networkView,
  settings,
  nodeLinkSettings,
  context,
}: {
  view: NetworkViewDescriptor;
  networkView: MaterializedNetworkView;
  settings?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings;
  nodeLinkSettings?: NodeLinkNetworkViewSettings;
  context: NetworkViewComputationContext;
}): ComputedView =>
  resolveComputedNetworkView({
    view,
    networkView,
    settings,
    nodeLinkSettings,
    nodeOrderIds: context.nodeOrderIds,
    atlasOrderLength: context.atlasOrderLength,
    activeLabelIds: context.activeLabelIds,
    matrixViewActiveLabelIds: context.matrixViewActiveLabelIds,
    temporaryGroups: view.temporaryNetworkId ? context.temporaryNetworks?.[view.temporaryNetworkId]?.groups : undefined,
    orderingAtlasDefinition: context.orderingAtlasDefinition,
    matrixHierarchyFields: context.matrixHierarchyFields,
    circularHierarchyFields: context.circularHierarchyFields,
    circularHierarchyCategoryOrder: context.circularHierarchyCategoryOrder,
    matrixHierarchyCategoryOrder: context.matrixHierarchyCategoryOrder,
    dataset: context.dataset,
    uiRangeMode: context.uiRangeMode,
    selectedNodeIds: context.selectedNodeIds,
  });

export const useNetworkViewComputationContextValue = () => {
  const dataset = useAppSelector(selectDatasetData);
  const temporaryNetworks = useAppSelector(state => state.networkVisualization.temporaryNetworksById);
  const selectedNodeIds = useAppSelector(state => state.networkVisualization.selectedNodeIds);
  const atlas = useAppSelector((state) => state.atlasUi);
  const uiRangeMode = useAppSelector(
    (state) => state.visualizationUi.uiRangeMode,
  );
  const { nodeOrderIds, activeLabelIds, presentationAtlasDefinition } = useAtlasLabelPresentation();
  const { activeLabelIds: matrixViewActiveLabelIds } = useAtlasLabelPresentation({
    useMatrixHierarchyOrder: true,
  });
  return useMemo(
    () => ({
      dataset,
      temporaryNetworks,
      nodeOrderIds,
      activeLabelIds,
      matrixViewActiveLabelIds,
      atlasOrderLength: atlas.order.length,
      orderingAtlasDefinition: presentationAtlasDefinition,
      matrixHierarchyFields: atlas.matrixHierarchyFields,
      circularHierarchyFields: atlas.circularHierarchyFields,
      circularHierarchyCategoryOrder: atlas.circularHierarchyCategoryOrder,
      matrixHierarchyCategoryOrder: atlas.matrixHierarchyCategoryOrder,
      uiRangeMode,
      selectedNodeIds,
    }),
    [
      activeLabelIds,
      presentationAtlasDefinition,
      atlas.matrixHierarchyFields,
      atlas.circularHierarchyFields,
      atlas.circularHierarchyCategoryOrder,
      atlas.matrixHierarchyCategoryOrder,
      atlas.order.length,
      dataset,
      temporaryNetworks,
      matrixViewActiveLabelIds,
      nodeOrderIds,
      uiRangeMode,
      selectedNodeIds,
    ],
  );
};
