import { configureStore } from '@reduxjs/toolkit'
import datasetReducer from '@/store/slices/dataset'
import visualizationUiReducer from '@/store/slices/visualizationUi'
import atlasDefinitionReducer from '@/store/slices/atlasDefinition'
import atlasReducer from '@/store/slices/atlas'
import networkVisualizationReducer from '@/store/slices/networkVisualization'
import matrixSummariesReducer from '@/store/slices/matrixSummaries'
import matrixCacheReducer from '@/store/slices/matrixCache'
import notificationsReducer from '@/store/slices/notifications'
import { userNotificationListenerMiddleware } from '@/store/userNotificationListeners'

export const store = configureStore({
  reducer: {
    dataset: datasetReducer,
    visualizationUi: visualizationUiReducer,
    atlas: atlasReducer,
    atlasDefinition: atlasDefinitionReducer,
    networkVisualization: networkVisualizationReducer,
    matrixSummaries: matrixSummariesReducer,
    matrixCache: matrixCacheReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
        ignoredActionPaths: ['meta.arg.file', 'meta.arg.files'],
      },
    }).prepend(userNotificationListenerMiddleware.middleware),
})
