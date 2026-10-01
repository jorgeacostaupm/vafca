import { createAction, type Middleware } from '@reduxjs/toolkit';
export const restoreWorkspace = createAction<unknown>('workspace/restore');
const pending = new Set<string>();
export const assertWorkspaceIdle = () => {
    if (pending.size)
        throw new Error('Wait for the current operation to finish before saving or opening a workspace.');
};
export const workspaceActivityMiddleware: Middleware = () => next => action => {
    const event = action as {
        type?: string;
        meta?: {
            requestId?: string;
            requestStatus?: string;
        };
    };
    const id = event.meta?.requestId;
    if (id && !event.type?.startsWith('workspace/')) {
        if (event.meta?.requestStatus === 'pending')
            pending.add(id);
        if (event.meta?.requestStatus === 'fulfilled' || event.meta?.requestStatus === 'rejected')
            pending.delete(id);
    }
    return next(action);
};
