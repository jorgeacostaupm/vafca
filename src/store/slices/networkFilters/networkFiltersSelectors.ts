import type { RootState } from "@/types/store";

export const selectActiveNetworkEdgeMask = (state: RootState) =>
  state.networkFilters.activeEdgeMask;
