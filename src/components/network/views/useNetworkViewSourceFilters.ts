import { useMemo } from "react";
import { resolveViewVisibility } from "@/components/network/views/networkViewVisibility";
import type {
  ComputedView,
  NetworkViewDescriptor,
  ViewVisibility,
} from "@/types/networkVisualization";

export const useNetworkViewSourceFilters = ({
  targetViewId,
  targetIsReduced,
  targetIsFilterSource,
  views,
  resolveView,
}: {
  targetViewId: string;
  targetIsReduced: boolean;
  targetIsFilterSource: boolean;
  views: NetworkViewDescriptor[];
  resolveView: (view: NetworkViewDescriptor) => ComputedView | null;
}) =>
  useMemo(() => {
    if (targetIsReduced || targetIsFilterSource) {
      return {
        nodeFilterContributors: [],
        linkFilterContributors: [],
        visibilityByViewId: {} as Record<string, ViewVisibility>,
      };
    }

    const source = views.find((view) => {
      if (view.id === targetViewId) return false;
      const computed = resolveView(view);
      return Boolean(computed?.useAsNodeFilter || computed?.useAsLinkFilter);
    });
    const computed = source ? resolveView(source) : null;
    if (!source || !computed) {
      return {
        nodeFilterContributors: [],
        linkFilterContributors: [],
        visibilityByViewId: {} as Record<string, ViewVisibility>,
      };
    }

    return {
      nodeFilterContributors: computed.useAsNodeFilter
        ? [{ viewId: source.id }]
        : [],
      linkFilterContributors: computed.useAsLinkFilter
        ? [{ viewId: source.id }]
        : [],
      visibilityByViewId: {
        [source.id]: resolveViewVisibility(computed),
      },
    };
  }, [resolveView, targetIsFilterSource, targetIsReduced, targetViewId, views]);
