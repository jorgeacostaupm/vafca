import { useMemo } from "react";

import { resolveComputedNetworkView } from "@/components/network/views/networkViewModel";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import type { MaterializedNetworkView } from "@/types/datasetNetworkView";
import type { DatasetMeta } from "@/types/datasetState";
import type { UiRangeMode } from "@/types/network";
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
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyCategoryOrder: Record<string, string[]>;
  uiRangeMode: UiRangeMode;
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
    circularHierarchyCategoryOrder: context.circularHierarchyCategoryOrder,
    matrixHierarchyCategoryOrder: context.matrixHierarchyCategoryOrder,
    dataset: context.dataset,
    uiRangeMode: context.uiRangeMode,
  });

export const useNetworkViewComputationContextValue = () => {
  const dataset = useAppSelector(selectDatasetData);
  const atlas = useAppSelector((state) => state.atlasUi);
  const uiRangeMode = useAppSelector(
    (state) => state.visualizationUi.uiRangeMode,
  );
  const { nodeOrderIds, activeLabelIds } = useAtlasLabelPresentation();
  const { activeLabelIds: matrixViewActiveLabelIds } = useAtlasLabelPresentation({
    useMatrixHierarchyOrder: true,
  });
  return useMemo(
    () => ({
      dataset,
      nodeOrderIds,
      activeLabelIds,
      matrixViewActiveLabelIds,
      atlasOrderLength: atlas.order.length,
      circularHierarchyCategoryOrder: atlas.circularHierarchyCategoryOrder,
      matrixHierarchyCategoryOrder: atlas.matrixHierarchyCategoryOrder,
      uiRangeMode,
    }),
    [
      activeLabelIds,
      atlas.circularHierarchyCategoryOrder,
      atlas.matrixHierarchyCategoryOrder,
      atlas.order.length,
      dataset,
      matrixViewActiveLabelIds,
      nodeOrderIds,
      uiRangeMode,
    ],
  );
};
