import { configureStore } from '@reduxjs/toolkit'

import { rankingFilterListenerMiddleware } from '@/store/rankingFilterListeners'
import atlasDefinitionReducer from '@/store/slices/atlasDefinition'
import atlasUiReducer from '@/store/slices/atlasUi'
import datasetReducer from '@/store/slices/dataset'
import datasetOperationsReducer from '@/store/slices/dataset/datasetOperationsSlice'
import networkFiltersReducer from '@/store/slices/networkFilters'
import networkLayoutReducer from '@/store/slices/networkLayout'
import networkMeasuresReducer from '@/store/slices/networkMeasures'
import networkSummariesReducer from '@/store/slices/networkSummaries'
import networkVisualizationReducer from '@/store/slices/networkVisualization'
import notificationsReducer from '@/store/slices/notifications'
import rankingsReducer from '@/store/slices/rankings'
import visualizationUiReducer from '@/store/slices/visualizationUi'
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
    networkMeasures: networkMeasuresReducer,
    networkLayout: networkLayoutReducer,
    networkSummaries: networkSummariesReducer,
    notifications: notificationsReducer,
    rankings: rankingsReducer,
  },
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
      rankingFilterListenerMiddleware.middleware,
      userNotificationListenerMiddleware.middleware,
    ),
})
