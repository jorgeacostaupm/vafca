import { combineReducers, type UnknownAction } from '@reduxjs/toolkit'

import atlasDefinitionReducer from '@/store/slices/atlasDefinition/atlasDefinitionSlice'
import atlasUiReducer from '@/store/slices/atlasUi/atlasUiSlice'
import datasetOperationsReducer from '@/store/slices/dataset/datasetOperationsSlice'
import datasetReducer from '@/store/slices/dataset/datasetSlice'
import networkFiltersReducer from '@/store/slices/networkFilters/networkFiltersSlice'
import networkLayoutReducer from '@/store/slices/networkLayout/networkLayoutSlice'
import networkVisualizationReducer from '@/store/slices/networkVisualization/networkVisualizationSlice'
import notificationsReducer from '@/store/slices/notifications/notificationsSlice'
import rankingsReducer from '@/store/slices/rankings/rankingsSlice'
import visualizationUiReducer from '@/store/slices/visualizationUi/visualizationUiSlice'
import { restoreWorkspace } from '@/workspace/actions'
import workspaceUiReducer from '@/workspace/workspaceUiSlice'

export const combinedReducer = combineReducers({
    workspaceUi: workspaceUiReducer,
    dataset: datasetReducer,
    datasetOperations: datasetOperationsReducer,
    visualizationUi: visualizationUiReducer,
    atlasUi: atlasUiReducer,
    atlasDefinition: atlasDefinitionReducer,
    networkVisualization: networkVisualizationReducer,
    networkFilters: networkFiltersReducer,
    networkLayout: networkLayoutReducer,
    notifications: notificationsReducer,
    rankings: rankingsReducer,
  })

export const rootReducer = (state: ReturnType<typeof combinedReducer> | undefined, action: UnknownAction): ReturnType<typeof combinedReducer> => {
  if (restoreWorkspace.match(action)) return action.payload as ReturnType<typeof combinedReducer>
  return combinedReducer(state, action)
}
