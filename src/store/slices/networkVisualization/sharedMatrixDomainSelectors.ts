import { createSelector } from '@reduxjs/toolkit';

import { selectAllDatasetNetworks, selectDatasetContent } from '@/store/slices/dataset';
import { selectUiRangeMode } from '@/store/slices/visualizationUi';
import type { MaterializedNetworkView } from '@/types/datasetNetworkView';
import type { Network } from '@/types/network';
import type { RootState } from '@/types/store';
import { createNetworkCompoundId } from '@/utils/networkMetadata';
import { buildSharedMatrixDomains } from '@/utils/sharedMatrixDomains';

import { selectNetworkViewsById, selectNetworkViewsOrder } from './networkVisualizationSelectors';

const selectNetworksByCompoundId = createSelector(
  [selectAllDatasetNetworks],
  networks => new Map(networks.map(network => [createNetworkCompoundId(network), network])),
);

const selectActiveMatrixDomains = createSelector(
  [selectNetworksByCompoundId, (state: RootState) => selectDatasetContent(state)?.catalogs,
    selectNetworkViewsOrder, selectNetworkViewsById,
    (state: RootState) => state.networkVisualization.temporaryNetworksById],
  (networks, catalogs, order, views, temporaryNetworks) => {
    const entries: { viewId: string; network: Network | MaterializedNetworkView }[] = [];
    for (const viewId of order) {
      const view = views[viewId];
      if (!view || view.type !== 'matrix' || view.status === 'error') continue;
      const temporary = view.temporaryNetworkId ? temporaryNetworks[view.temporaryNetworkId] : undefined;
      const network = temporary ? {
        ...temporary, compoundId: temporary.id, sourceId: 'temporary', dimensions: {},
      } : networks.get(view.compoundId);
      if (network) entries.push({ viewId, network });
    }
    // ponytail: O(active views), using stored statistics; index group extrema only if view counts demand it.
    return buildSharedMatrixDomains(entries, catalogs);
  },
);

export const selectSharedMatrixDomains = createSelector(
  [selectUiRangeMode, selectActiveMatrixDomains],
  (mode, domains) => mode === 'shared' ? domains : {},
);
