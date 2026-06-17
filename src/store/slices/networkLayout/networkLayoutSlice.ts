import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import {
  DEFAULT_NETWORK_PANEL_LAYOUT,
  DEFAULT_RANKING_PANEL_LAYOUT,
} from "@/config/ui";
import { runRankingQuery } from "@/store/slices/rankings/thunks";
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

      state.layout = [
        { i: viewId, x: initialX, y: initialY, w: defaultW, h: defaultH },
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
  extraReducers: (builder) => {
    builder.addCase(runRankingQuery.fulfilled, (state, action) => {
      state.layout = [
        {
          i: action.payload.id,
          x: DEFAULT_RANKING_PANEL_LAYOUT.initialX,
          y: DEFAULT_RANKING_PANEL_LAYOUT.initialY,
          w: DEFAULT_RANKING_PANEL_LAYOUT.width,
          h: DEFAULT_RANKING_PANEL_LAYOUT.height,
        },
        ...state.layout.map((entry) => ({
          ...entry,
          y: entry.y + DEFAULT_RANKING_PANEL_LAYOUT.height,
        })),
      ];
    });
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
