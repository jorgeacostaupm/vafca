import type { Middleware } from '@reduxjs/toolkit';

import type { combinedReducer } from '@/store/rootReducer';
import { resetNetworkZoomLabelSelection } from '@/store/slices/networkVisualization';
import { enqueueNotification } from '@/store/slices/notifications';

import { releaseSpatialAtlas } from './loadSpatialAtlas';

export const spatialLifecycle: Middleware<object, ReturnType<typeof combinedReducer>> = api => next => action => {
  const previous = api.getState().dataset.nodeSet?.spatial;
  const result = next(action);
  const type = (action as { type?: string }).type;
  if (type === 'dataset/setDataset' || type === 'dataset/clearDataset') api.dispatch(resetNetworkZoomLabelSelection());
  const current = api.getState().dataset.nodeSet?.spatial;
  if (previous?.resourceId !== current?.resourceId) {
    if (previous) releaseSpatialAtlas(previous.resourceId);
    if (current?.manifest.atlas) api.dispatch(enqueueNotification({
      kind: current.warnings.length ? 'warning' : 'success',
      message: `Spatial atlas loaded: ${current.matchedRois}/${api.getState().dataset.nodeSet?.nodes.length ?? 0} ROIs matched.`,
      description: current.warnings.join('\n') || 'All ROI geometries matched.',
    }));
  }
  return result;
};
