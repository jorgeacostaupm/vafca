import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  DEFAULT_NETWORK_PANEL_LAYOUT,
  DEFAULT_PANEL_GRID_CONFIG,
} from "@/config/ui";
import type { NetworkLayoutItem } from "@/types/networkVisualization";

import { initialNetworkLayoutState } from "./networkLayoutTypes";

const networkLayoutSlice = createSlice({
  name: "networkLayout",
  initialState: initialNetworkLayoutState,
  reducers: {
    setNetworkLayout(state, action: PayloadAction<NetworkLayoutItem[]>) {
      state.layout = action.payload.map((entry) => ({ ...entry }));
    },
    addNetworkLayoutItem(
      state,
      action: PayloadAction<{
        viewId: string;
        defaultW?: number;
        defaultH?: number;
        initialX?: number;
        initialY?: number;
        yOffset?: number;
      }>,
    ) {
      const { viewId } = action.payload;
      const defaultW = action.payload.defaultW ?? DEFAULT_NETWORK_PANEL_LAYOUT.width;
      const defaultH = action.payload.defaultH ?? DEFAULT_NETWORK_PANEL_LAYOUT.height;
      const initialX =
        action.payload.initialX ?? DEFAULT_NETWORK_PANEL_LAYOUT.initialX;
      const initialY =
        action.payload.initialY ?? DEFAULT_NETWORK_PANEL_LAYOUT.initialY;
      const yOffset = action.payload.yOffset ?? defaultH;
      const panelsPerRow = Math.max(
        1,
        Math.floor(DEFAULT_PANEL_GRID_CONFIG.columns / defaultW),
      );
      const x = initialX + (state.layout.length % panelsPerRow) * defaultW;

      state.layout = [
        { i: viewId, x, y: initialY, w: defaultW, h: defaultH },
        ...state.layout.map((entry) => ({
          ...entry,
          y: entry.y + yOffset,
        })),
      ];
    },
    removeNetworkLayoutItem(state, action: PayloadAction<{ viewId: string }>) {
      state.layout = state.layout.filter((entry) => entry.i !== action.payload.viewId);
    },
    removeNetworkLayoutItems(state, action: PayloadAction<{ viewIds: string[] }>) {
      const viewIds = new Set(action.payload.viewIds);
      state.layout = state.layout.filter((entry) => !viewIds.has(entry.i));
    },
    clearNetworkLayout(state) {
      state.layout = [];
    },
  },
});

export const {
  setNetworkLayout,
  addNetworkLayoutItem,
  removeNetworkLayoutItem,
  removeNetworkLayoutItems,
  clearNetworkLayout,
} = networkLayoutSlice.actions;

export default networkLayoutSlice.reducer;
