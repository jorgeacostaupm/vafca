import type { ReactNode } from "react";

import { NetworkViewComputationContextInstance } from "@/components/network/views/networkViewComputationContext";
import { useNetworkViewComputationContextValue } from "@/components/network/views/useNetworkViewResolver";

type NetworkViewComputationProviderProps = {
  children: ReactNode;
};

export function NetworkViewComputationProvider({
  children,
}: NetworkViewComputationProviderProps) {
  const value = useNetworkViewComputationContextValue();

  return (
    <NetworkViewComputationContextInstance.Provider value={value}>
      {children}
    </NetworkViewComputationContextInstance.Provider>
  );
}
