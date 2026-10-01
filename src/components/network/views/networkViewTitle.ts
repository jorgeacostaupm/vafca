import type { NetworkViewType } from "@/types/networkVisualization";

export const resolveNetworkViewTitle = (type: NetworkViewType) =>
  type === "matrix" ? "Matrix" : type === "circular" ? "Connectogram" : "Node-Link";
