import { combinedReducer } from '@/store/rootReducer';
import { setUploadedAtlas } from '@/store/slices/atlasDefinition';
import { selectDatasetContent, setDataset } from '@/store/slices/dataset';
import { resolveNetworkFilterRuntime } from '@/store/slices/networkFilters/networkFiltersRuntime';
import type { RootState } from '@/types/store';
import { buildAtlasSourceFromNodeSet } from '@/utils/atlas/nodeDerivedAtlas';
import { computeNetworkMatrixDataStats } from '@/utils/networkDataStats';
import { computeRanking } from '@/utils/rankings/rankingCalculations';

import { sessionSchema } from './sessionSchema';
import { validateWorkspace } from './validateWorkspace';
export const snapshotWorkspace = (state: RootState) => {
    const content = selectDatasetContent(state);
    const atlas = state.atlasDefinition.uploaded?.atlas ?? (content ? state.atlasDefinition.defaultById[content.nodeSet.id] : null) ?? null;
    const dataset = content ? { ...content, networkIndex: undefined } : null;
    const session = {
        workspaceUi: state.workspaceUi, atlasUi: state.atlasUi, visualizationUi: state.visualizationUi,
        networkVisualization: state.networkVisualization, networkLayout: state.networkLayout,
        networkFilters: state.networkFilters, rankings: state.rankings,
    };
    // JSON null represents missing/non-finite matrix values; it never becomes a zero on restore.
    return { dataset, atlas, session: sessionSchema.parse(JSON.parse(JSON.stringify(session))) };
};
export const prepareWorkspace = (raw: Parameters<typeof validateWorkspace>[0]): RootState => {
    const { dataset, atlas, session } = validateWorkspace(raw);
    let state = combinedReducer(undefined, { type: '@@workspace/init' });
    if (dataset)
        state = combinedReducer(state, setDataset({ content: dataset }));
    if (!atlas && dataset) {
        const source = buildAtlasSourceFromNodeSet(dataset.nodeSet, 'Workspace nodes');
        if (source)
            state = combinedReducer(state, setUploadedAtlas(source));
    }
    if (atlas)
        state = combinedReducer(state, setUploadedAtlas({ atlas, fileName: 'Workspace atlas' }));
    // Boundary schemas validate every persisted session field before this atomic replacement.
    const saved = session as unknown as Pick<RootState, 'workspaceUi' | 'atlasUi' | 'visualizationUi' | 'networkVisualization' | 'networkLayout' | 'networkFilters' | 'rankings'>;
    state = { ...state, ...saved,
        datasetOperations: { ...state.datasetOperations, status: dataset ? 'ready' : 'idle' },
        visualizationUi: { ...state.visualizationUi, ...saved.visualizationUi },
        rankings: { ...state.rankings, ...saved.rankings },
        networkFilters: { ...state.networkFilters, ...saved.networkFilters },
    };
    state.visualizationUi.annotations = session.visualizationUi.annotations.map(annotation => {
        const selectedLinks = annotation.selectedLinks.map(link => ({ ...link, sources: link.sources.map(source => ({ ...source, value: source.value ?? NaN })) }));
        const selectedLinkIdsByRowId: Record<string, string[]> = {};
        for (const link of selectedLinks) (selectedLinkIdsByRowId[link.rowId] ??= []).push(link.id);
        return { ...annotation, selectedLinks, selectedLinksById: Object.fromEntries(selectedLinks.map(link => [link.id, link])), selectedLinkIdsByRowId };
    });
    state.networkVisualization = structuredClone(state.networkVisualization);
    for (const net of Object.values(state.networkVisualization.temporaryNetworksById)) {
        net.data = net.data.map(row => row.map(value => value === null ? NaN : value));
        net.dataStats = computeNetworkMatrixDataStats(net.data);
    }
    for (const view of Object.values(state.networkVisualization.viewsById)) {
        view.status = 'ready';
        delete view.error;
        delete view.loadingMessage;
    }
    for (const mode of ['original', 'aggregated'] as const) {
        const definition = mode === 'original' ? state.networkFilters.activeNetworkFilter : state.networkFilters.activeAggregatedNetworkFilter;
        if (!definition)
            continue;
        const runtime = resolveNetworkFilterRuntime({ mode, definition, dataset: dataset ? { content: dataset } : null, uiRangeMode: state.visualizationUi.uiRangeMode });
        if (!runtime.validation.valid)
            throw new Error('Workspace contains an invalid network filter.');
        if (mode === 'original')
            state.networkFilters.activeEdgeMask = runtime.mask;
        else
            state.networkFilters.activeAggregatedEdgeMask = runtime.mask;
    }
    state.rankings = structuredClone(state.rankings);
    for (const id of state.rankings.resultsOrder) {
        if (!dataset)
            throw new Error('Ranking requires a dataset.');
        const result = state.rankings.resultsById[id];
        state.rankings.resultsById[id] = { ...computeRanking({ datasetContent: dataset, query: result.query, activeNodes: new Set(state.atlasUi.order.filter(nodeId => state.atlasUi.labelsById[nodeId]?.enabled !== false)), activeFilterMask: state.networkFilters.activeEdgeMask?.values ?? null }), id, createdAt: result.createdAt };
    }
    return state;
};
