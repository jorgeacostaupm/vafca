import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_APP_SECTION } from '@/config/ui';
type CameraPose = {
    position: [
        number,
        number,
        number
    ];
    target: [
        number,
        number,
        number
    ];
    zoom: number;
};
type WorkspaceUi = {
    activeSection: 'vis' | 'derive' | 'atlas' | 'links' | 'catalogs' | 'data' | 'settings';
    selectedNetworkIds: string[];
    dismissedNetworkIds: string[];
    linksViewEnabled: boolean;
    linksViewType: 'matrix' | 'circular';
    linksNodeMode: 'connected' | 'all';
    cameras: Partial<Record<'atlas' | 'links', CameraPose>>;
};
const initialState: WorkspaceUi = { activeSection: DEFAULT_APP_SECTION, selectedNetworkIds: [], dismissedNetworkIds: [], linksViewEnabled: true, linksViewType: 'matrix', linksNodeMode: 'connected', cameras: {} };
const slice = createSlice({ name: 'workspaceUi', initialState, reducers: {
        patchWorkspaceUi(state, action: PayloadAction<Partial<WorkspaceUi>>) { Object.assign(state, action.payload); },
        saveWorkspaceCamera(state, action: PayloadAction<{
            id: 'atlas' | 'links';
            pose: CameraPose;
        }>) { state.cameras[action.payload.id] = action.payload.pose; },
    } });
export const { patchWorkspaceUi, saveWorkspaceCamera } = slice.actions;
export default slice.reducer;
