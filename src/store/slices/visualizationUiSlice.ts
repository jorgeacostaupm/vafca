import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MatrixShape } from "@/utils/matrixValue";

export type HoveredCell =
  | {
      rowId: string;
      colId: string;
    }
  | null;

export type SelectedLink = {
  id: string;
  rowId: string;
  colId: string;
  rowLabel: string;
  colLabel: string;
  sources: Array<{
    compoundId: string;
    matrixLabel: string;
    value: number;
  }>;
};

type VisualizationUiState = {
  hoveredCell: HoveredCell;
  hoveredNodeId: string | null;
  selectedLinks: SelectedLink[];
  atlasLinkIds: string[];
  matrixShape: MatrixShape;
  atlasPanel: AtlasPanelState;
};

export type AtlasPanelListLayoutMode = "columns" | "single";

export type AtlasPanelState = {
  query: string;
  groupByFields: string[];
  listLayoutMode: AtlasPanelListLayoutMode;
  selectedFilters: Record<string, string>;
  collapsedGroups: string[];
  viewerHeight: number;
};

const initialAtlasPanelState: AtlasPanelState = {
  query: "",
  groupByFields: [],
  listLayoutMode: "columns",
  selectedFilters: {},
  collapsedGroups: [],
  viewerHeight: 520,
};

const initialState: VisualizationUiState = {
  hoveredCell: null,
  hoveredNodeId: null,
  selectedLinks: [],
  atlasLinkIds: [],
  matrixShape: "full",
  atlasPanel: initialAtlasPanelState,
};

const visualizationUiSlice = createSlice({
  name: "visualizationUi",
  initialState,
  reducers: {
    setHoveredCell(state, action: PayloadAction<HoveredCell>) {
      state.hoveredCell = action.payload;
    },
    clearHoveredCell(state) {
      state.hoveredCell = null;
    },
    setHoveredNode(state, action: PayloadAction<string>) {
      state.hoveredNodeId = action.payload;
    },
    clearHoveredNode(state) {
      state.hoveredNodeId = null;
    },
    addSelectedLink(state, action: PayloadAction<SelectedLink>) {
      if (state.selectedLinks.some((link) => link.id === action.payload.id)) {
        return;
      }
      state.selectedLinks.push(action.payload);
    },
    removeSelectedLink(state, action: PayloadAction<string>) {
      state.selectedLinks = state.selectedLinks.filter(
        (link) => link.id !== action.payload,
      );
      state.atlasLinkIds = state.atlasLinkIds.filter(
        (id) => id !== action.payload,
      );
    },
    clearSelectedLinks(state) {
      state.selectedLinks = [];
      state.atlasLinkIds = [];
    },
    setAtlasLinkIds(state, action: PayloadAction<string[]>) {
      state.atlasLinkIds = Array.from(new Set(action.payload));
    },
    toggleAtlasLinkId(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.atlasLinkIds.includes(id)) {
        state.atlasLinkIds = state.atlasLinkIds.filter(
          (linkId) => linkId !== id,
        );
        return;
      }
      state.atlasLinkIds.push(id);
    },
    clearAtlasLinkIds(state) {
      state.atlasLinkIds = [];
    },
    setMatrixShape(state, action: PayloadAction<MatrixShape>) {
      state.matrixShape = action.payload;
    },
    setAtlasPanelState(state, action: PayloadAction<Partial<AtlasPanelState>>) {
      state.atlasPanel = { ...state.atlasPanel, ...action.payload };
    },
  },
});

export const {
  setHoveredCell,
  clearHoveredCell,
  setHoveredNode,
  clearHoveredNode,
  addSelectedLink,
  removeSelectedLink,
  clearSelectedLinks,
  setAtlasLinkIds,
  toggleAtlasLinkId,
  clearAtlasLinkIds,
  setMatrixShape,
  setAtlasPanelState,
} = visualizationUiSlice.actions;

export default visualizationUiSlice.reducer;
