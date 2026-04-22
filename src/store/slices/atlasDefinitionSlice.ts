import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AtlasDefinitionState, AtlasSource } from "@/types/atlas";


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
