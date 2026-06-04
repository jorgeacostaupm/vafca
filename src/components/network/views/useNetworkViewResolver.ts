import { useMemo } from "react";

import { resolveComputedNetworkView } from "@/components/network/views/networkViewModel";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetViewData } from "@/store/slices/dataset";
import type { UiRangeMode } from "@/types/connectivityBundle";
import type { DatasetMeta } from "@/types/datasetState";
import type { StoredMatrix } from "@/types/matrixStore";
import type {
  ComputedView,
  MatrixNetworkViewSettings,
  NetworkViewDescriptor,
  NodeLinkNetworkViewSettings,
} from "@/types/networkVisualization";

export type NetworkViewComputationContext = {
  dataset: DatasetMeta | null;
  matrixByCompoundId: Record<string, StoredMatrix>;
  matrixOrderIds: string[];
  activeLabelIds: string[];
  matrixActiveLabelIds: string[];
  atlasOrderLength: number;
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyCategoryOrder: Record<string, string[]>;
  uiRangeMode: UiRangeMode;
};

export const resolveNetworkViewWithContext = ({
  view,
  matrix,
  settings,
  nodeLinkSettings,
  context,
}: {
  view: NetworkViewDescriptor;
  matrix: StoredMatrix;
  settings?: MatrixNetworkViewSettings | NodeLinkNetworkViewSettings;
  nodeLinkSettings?: NodeLinkNetworkViewSettings;
  context: NetworkViewComputationContext;
}): ComputedView =>
  resolveComputedNetworkView({
    view,
    matrix,
    settings,
    nodeLinkSettings,
    matrixOrderIds: context.matrixOrderIds,
    atlasOrderLength: context.atlasOrderLength,
    activeLabelIds: context.activeLabelIds,
    matrixActiveLabelIds: context.matrixActiveLabelIds,
    circularHierarchyCategoryOrder: context.circularHierarchyCategoryOrder,
    matrixHierarchyCategoryOrder: context.matrixHierarchyCategoryOrder,
    dataset: context.dataset,
    uiRangeMode: context.uiRangeMode,
  });

export const useNetworkViewComputationContextValue = () => {
  const { dataset, matrixByCompoundId } = useAppSelector(selectDatasetViewData);
  const atlas = useAppSelector((state) => state.atlasUi);
  const uiRangeMode = useAppSelector(
    (state) => state.visualizationUi.uiRangeMode,
  );
  const { matrixOrderIds, activeLabelIds } = useAtlasLabelPresentation();
  const { activeLabelIds: matrixActiveLabelIds } = useAtlasLabelPresentation({
    useMatrixHierarchyOrder: true,
  });
  return useMemo(
    () => ({
      dataset,
      matrixByCompoundId,
      matrixOrderIds,
      activeLabelIds,
      matrixActiveLabelIds,
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
      matrixByCompoundId,
      matrixActiveLabelIds,
      matrixOrderIds,
      uiRangeMode,
    ],
  );
};
