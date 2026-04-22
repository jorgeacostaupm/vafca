import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MatrixShape } from "@/types/matrix";
import type {
  AtlasPanelState,
  HoveredCell,
  SelectedLink,
  VisualizationUiState,
} from "@/types/visualizationUi";


const initialAtlasPanelState: AtlasPanelState = {
  query: "",
  groupByFields: [],
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
