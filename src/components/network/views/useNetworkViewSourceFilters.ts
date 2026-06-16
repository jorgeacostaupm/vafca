import { useMemo } from "react";
import { shallowEqual } from "react-redux";

import { resolveViewVisibility } from "@/components/network/views/networkViewVisibility";
import {
  type NetworkViewComputationContext,
  resolveNetworkViewWithContext,
} from "@/components/network/views/useNetworkViewResolver";
import { useAppSelector } from "@/store/hooks";
import type {
  NodeLinkNetworkViewSettings,
  ViewVisibility,
} from "@/types/networkVisualization";

const emptySourceFilters = {
  nodeFilterContributors: [],
  linkFilterContributors: [],
  visibilityByViewId: {} as Record<string, ViewVisibility>,
};

export const useNetworkViewSourceFilters = ({
  targetViewId,
  targetIsAggregated,
  targetIsFilterSource,
  context,
}: {
  targetViewId: string;
  targetIsAggregated: boolean;
  targetIsFilterSource: boolean;
  context: NetworkViewComputationContext;
}) => {
  const source = useAppSelector((state) => {
    if (targetIsAggregated || targetIsFilterSource) {
      return null;
    }

    for (const viewId of state.networkVisualization.viewsOrder) {
      if (viewId === targetViewId) continue;
      const view = state.networkVisualization.viewsById[viewId];
      if (!view) continue;

      const matrixSettings =
        state.networkVisualization.matrixSettingsByViewId[viewId];
      const nodeLinkSettings =
        state.networkVisualization.nodeLinkSettingsByViewId[viewId];
      const settings =
        view.type === "matrix" ? matrixSettings : nodeLinkSettings;

      if (settings?.useAsNodeFilter || settings?.useAsLinkFilter) {
        return { view, settings, nodeLinkSettings };
      }
    }

    return null;
  }, shallowEqual);

  return useMemo(() => {
    if (targetIsAggregated || targetIsFilterSource) return emptySourceFilters;
    const networkView = source
      ? context.networkViewsByCompoundId[source.view.compoundId] ?? null
      : null;
    const computed =
      source && networkView
        ? resolveNetworkViewWithContext({
            view: source.view,
            networkView,
            settings: source.settings,
            nodeLinkSettings:
              source.view.type === "matrix"
                ? undefined
                : (source.nodeLinkSettings as NodeLinkNetworkViewSettings),
            context,
          })
        : null;

    if (!source || !computed) {
      return emptySourceFilters;
    }

    return {
      nodeFilterContributors: computed.useAsNodeFilter
        ? [{ viewId: source.view.id }]
        : [],
      linkFilterContributors: computed.useAsLinkFilter
        ? [{ viewId: source.view.id }]
        : [],
      visibilityByViewId: {
        [source.view.id]: resolveViewVisibility(computed),
      },
    };
  }, [context, source, targetIsFilterSource, targetIsAggregated]);
};
