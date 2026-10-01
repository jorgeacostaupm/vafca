import { createAsyncThunk } from '@reduxjs/toolkit';

import { setSharedHoverState } from '@/components/hover/sharedHover';
import { WORKSPACE_MAX_BYTES } from '@/config/ui';
import { releaseSpatialAtlas } from '@/spatial/loadSpatialAtlas';
import type { RootState } from '@/types/store';

import { assertWorkspaceIdle, restoreWorkspace } from './actions';
import { decodeWorkspace, encodeWorkspace } from './archive';
import { prepareWorkspace, snapshotWorkspace } from './state';
export const saveWorkspace = createAsyncThunk<void, void, {
    state: RootState;
}>('workspace/save', async (_, { getState }) => {
    assertWorkspaceIdle();
    const snapshot = snapshotWorkspace(getState());
    const prepared = prepareWorkspace(snapshot);
    const bytes = await encodeWorkspace(snapshotWorkspace(prepared));
    const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/zip' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `vafca-workspace-${new Date().toISOString().slice(0, 10)}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
});
export const openWorkspace = createAsyncThunk<void, {
    file: File;
}>('workspace/open', async ({ file }, { dispatch }) => {
    assertWorkspaceIdle();
    if (file.size > WORKSPACE_MAX_BYTES)
        throw new Error('Workspace file is too large.');
    const payload = await decodeWorkspace(new Uint8Array(await file.arrayBuffer()));
    try {
        const state = prepareWorkspace(payload);
        assertWorkspaceIdle();
        setSharedHoverState(null);
        dispatch(restoreWorkspace(state));
    } catch (error) {
        if (payload.dataset?.nodeSet.spatial) releaseSpatialAtlas(payload.dataset.nodeSet.spatial.resourceId);
        throw error;
    }
});
