import { configureStore } from '@reduxjs/toolkit'
import datasetReducer from '@/store/slices/datasetSlice'
import visualizationUiReducer from '@/store/slices/visualizationUiSlice'
import atlasDefinitionReducer from '@/store/slices/atlasDefinitionSlice'
import atlasReducer from '@/store/slices/atlasSlice'
import networkVisualizationReducer from '@/store/slices/networkVisualizationSlice'

export const store = configureStore({
  reducer: {
    dataset: datasetReducer,
    visualizationUi: visualizationUiReducer,
    atlas: atlasReducer,
    atlasDefinition: atlasDefinitionReducer,
    networkVisualization: networkVisualizationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 128,
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
