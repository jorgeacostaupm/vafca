import { configureStore } from '@reduxjs/toolkit'

import { spatialLifecycle } from '@/spatial/lifecycle';
import { rankingFilterListenerMiddleware } from '@/store/rankingFilterListeners'
import { rootReducer } from '@/store/rootReducer'
import { userNotificationListenerMiddleware } from '@/store/userNotificationListeners'
import { workspaceActivityMiddleware } from '@/workspace/actions'

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: ['dataset.networks'],
      },
      serializableCheck: {
        warnAfter: 128,
        ignoredActionPaths: ['meta.arg.file', 'meta.arg.files'],
        ignoredPaths: ['dataset.networks'],
      },
    }).prepend(
      workspaceActivityMiddleware,
      spatialLifecycle,
      rankingFilterListenerMiddleware.middleware,
      userNotificationListenerMiddleware.middleware,
    ),
})
