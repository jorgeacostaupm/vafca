import { createContext, useContext } from "react";

import type { NetworkViewComputationContext } from "@/components/network/views/useNetworkViewResolver";

export const NetworkViewComputationContextInstance =
  createContext<NetworkViewComputationContext | null>(null);

export const useNetworkViewComputationContext = () => {
  const value = useContext(NetworkViewComputationContextInstance);
  if (!value) {
    throw new Error(
      "useNetworkViewComputationContext must be used inside NetworkViewComputationProvider.",
    );
  }
  return value;
};
