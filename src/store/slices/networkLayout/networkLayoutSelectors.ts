import type { RootState } from "@/types/store";

export const selectNetworkLayoutState = (state: RootState) => state.networkLayout;
export const selectNetworkLayout = (state: RootState) => state.networkLayout.layout;
