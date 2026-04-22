import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AtlasSource } from "@/types/atlas";

export type AtlasDefinitionState = {
  uploaded: AtlasSource | null;
};

const initialState: AtlasDefinitionState = {
  uploaded: null,
};

const atlasDefinitionSlice = createSlice({
  name: "atlasDefinition",
  initialState,
  reducers: {
    setUploadedAtlas(state, action: PayloadAction<AtlasSource>) {
      state.uploaded = action.payload;
    },
    clearUploadedAtlas(state) {
      state.uploaded = null;
    },
  },
});

export const { setUploadedAtlas, clearUploadedAtlas } = atlasDefinitionSlice.actions;

export default atlasDefinitionSlice.reducer;
