import type { ComputedView } from "@/types/networkVisualization";

export type NetworkViewValueFilters = {
  measure: null;
  stat: ComputedView["statFilter"];
  percentLinkIds: Set<string> | null;
};
