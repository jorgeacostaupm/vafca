import { configureStore } from '@reduxjs/toolkit'
import datasetReducer from '@/store/slices/dataset'
import datasetOperationsReducer from '@/store/slices/dataset/datasetOperationsSlice'
import visualizationUiReducer from '@/store/slices/visualizationUi'
import atlasDefinitionReducer from '@/store/slices/atlasDefinition'
import atlasUiReducer from '@/store/slices/atlasUi'
import networkVisualizationReducer from '@/store/slices/networkVisualization'
import networkFiltersReducer from '@/store/slices/networkFilters'
import networkLayoutReducer from '@/store/slices/networkLayout'
import matrixSummariesReducer from '@/store/slices/matrixSummaries'
import notificationsReducer from '@/store/slices/notifications'
import rankingsReducer from '@/store/slices/rankings'
import { rankingFilterListenerMiddleware } from '@/store/rankingFilterListeners'
import { userNotificationListenerMiddleware } from '@/store/userNotificationListeners'

export const store = configureStore({
  reducer: {
    dataset: datasetReducer,
    datasetOperations: datasetOperationsReducer,
    visualizationUi: visualizationUiReducer,
    atlasUi: atlasUiReducer,
    atlasDefinition: atlasDefinitionReducer,
    networkVisualization: networkVisualizationReducer,
    networkFilters: networkFiltersReducer,
    networkLayout: networkLayoutReducer,
    matrixSummaries: matrixSummariesReducer,
    notifications: notificationsReducer,
    rankings: rankingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
        ignoredActionPaths: ['meta.arg.file', 'meta.arg.files'],
      },
    }).prepend(
      rankingFilterListenerMiddleware.middleware,
      userNotificationListenerMiddleware.middleware,
    ),
})
