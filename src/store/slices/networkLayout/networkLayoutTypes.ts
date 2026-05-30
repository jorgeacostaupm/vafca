import type { NetworkLayoutItem } from "@/types/networkVisualization";

export type NetworkLayoutState = {
  layout: NetworkLayoutItem[];
};

export const initialNetworkLayoutState: NetworkLayoutState = {
  layout: [],
};
