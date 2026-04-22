import type { NetworkViewType } from "@/types/networkVisualization";

export const resolveNetworkPanelViewTitle = (type: NetworkViewType) =>
  type === "matrix" ? "Matrix" : type === "circular" ? "Circular" : "Node-Link";
