import { collectVisibleGraph } from "@/components/network/networkFormatting";
import type { NetworkViewValueFilters } from "@/types/networkViews";
import type {
  ComputedView,
  ViewVisibility,
} from "@/types/networkVisualization";
import { filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";

export const buildNetworkViewValueFilters = (
  computed: ComputedView,
): NetworkViewValueFilters => ({
  measure: null,
  stat: computed.statFilter,
});

export const resolveViewVisibility = (computed: ComputedView): ViewVisibility => {
  const valueFilters = buildNetworkViewValueFilters(computed);

  if (computed.view.type === "matrix") {
    const rendered = computed.hideIsolatedNodes
      ? filterIsolatedMatrixEntries(
          computed.data,
          computed.rowLabels,
          computed.colLabels,
          valueFilters,
        )
      : {
          data: computed.data,
          rowLabels: computed.rowLabels,
          colLabels: computed.colLabels,
        };

    return collectVisibleGraph({
      data: rendered.data,
      rowLabels: rendered.rowLabels ?? [],
      colLabels: rendered.colLabels ?? [],
      includeIsolatedNodes: !computed.hideIsolatedNodes,
      valueFilters,
    });
  }

  return collectVisibleGraph({
    data: computed.data,
    rowLabels: computed.rowLabels,
    colLabels: computed.rowLabels,
    includeIsolatedNodes: !computed.hideIsolatedNodes,
    valueFilters,
  });
};
