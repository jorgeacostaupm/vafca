import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { resolveComputedNetworkView } from "@/components/network/views/networkViewModel";
import { getDatasetMatrixByCompoundId } from "@/utils/datasetAccessors";
import type {
  ComputedView,
  NetworkViewDescriptor,
} from "@/types/networkVisualization";

export const useNetworkViews = () => {
  const viewsOrder = useAppSelector(
    (state) => state.networkVisualization.viewsOrder,
  );
  const viewsById = useAppSelector(
    (state) => state.networkVisualization.viewsById,
  );

  return useMemo(
    () =>
      viewsOrder
        .map((id) => viewsById[id])
        .filter((view): view is NetworkViewDescriptor => Boolean(view)),
    [viewsById, viewsOrder],
  );
};

export const useNetworkViewResolver = () => {
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const uiRangeMode = useAppSelector(
    (state) => state.visualizationUi.uiRangeMode,
  );
  const matrixSettingsByViewId = useAppSelector(
    (state) => state.networkVisualization.matrixSettingsByViewId,
  );
  const nodeLinkSettingsByViewId = useAppSelector(
    (state) => state.networkVisualization.nodeLinkSettingsByViewId,
  );
  const { matrixOrderIds, activeLabelIds } = useAtlasLabelPresentation();
  const { activeLabelIds: matrixActiveLabelIds } = useAtlasLabelPresentation({
    useMatrixHierarchyOrder: true,
  });

  return useMemo(
    () => ({
      dataset,
      resolve(view: NetworkViewDescriptor): ComputedView | null {
        const matrix = getDatasetMatrixByCompoundId(dataset, view.compoundId);
        if (!matrix) return null;
        const settings =
          view.type === "matrix"
            ? matrixSettingsByViewId[view.id]
            : nodeLinkSettingsByViewId[view.id];
        const nodeLinkSettings =
          view.type === "matrix" ? undefined : nodeLinkSettingsByViewId[view.id];

        return resolveComputedNetworkView({
          view,
          matrix,
          settings,
          nodeLinkSettings,
          matrixOrderIds,
          atlasOrderLength: atlas.order.length,
          activeLabelIds,
          matrixActiveLabelIds,
          circularHierarchyCategoryOrder: atlas.circularHierarchyCategoryOrder,
          matrixHierarchyCategoryOrder: atlas.matrixHierarchyCategoryOrder,
          dataset,
          uiRangeMode,
        });
      },
      matrixOrderIds,
      activeLabelIds,
      uiRangeMode,
    }),
    [
      activeLabelIds,
      atlas.circularHierarchyCategoryOrder,
      atlas.matrixHierarchyCategoryOrder,
      atlas.order.length,
      dataset,
      matrixActiveLabelIds,
      matrixOrderIds,
      matrixSettingsByViewId,
      nodeLinkSettingsByViewId,
      uiRangeMode,
    ],
  );
};
