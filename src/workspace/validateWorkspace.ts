import type { AtlasDefinition } from '@/types/atlas';
import type { NetworkDataset } from '@/types/network';
import { materializeNetworkMatrix } from '@/utils/networkData';
import { createNetworkCompoundId } from '@/utils/networkMetadata';

import { atlasSchema, datasetSchema } from './dataSchema';
import { sessionSchema } from './sessionSchema';
const unique = (ids: string[], label: string) => {
    if (new Set(ids).size !== ids.length)
        throw new Error(`Duplicate ${label} IDs.`);
};
export const validateWorkspace = (raw: {
    dataset: unknown;
    atlas: unknown;
    session: unknown;
}) => {
    const parsedDataset = datasetSchema.parse(raw.dataset);
    const dataset = parsedDataset as unknown as NetworkDataset | null;
    if (dataset) {
        dataset.networkIndex = Object.fromEntries(dataset.networks.map(network => [network.id, network]));
        unique(dataset.networks.map(network => network.id), 'network');
        unique(dataset.nodeSet.nodes.map(node => node.id), 'node');
        const ids = new Set(dataset.nodeSet.nodes.map(node => node.id));
        for (const network of dataset.networks) {
            unique(network.nodeIds, 'network node');
            if (!dataset.catalogs.sources[network.sourceId] || !dataset.catalogs.measures[network.measureId] || !dataset.catalogs.statistics[network.statisticId])
                throw new Error(`Missing catalog for ${network.id}.`);
            if (!network.derivation || network.derivation.type !== 'aggregation') {
                if (network.nodeIds.some(id => !ids.has(id)))
                    throw new Error(`Unknown node in ${network.id}.`);
            }
            const size = network.nodeIds.length;
            if (network.data.format === 'matrix') {
                const values = network.data.values;
                const valid = network.data.layout === 'full'
                    ? values.length === size && values.every(row => Array.isArray(row) && row.length === size)
                    : values.length === size * (size + 1) / 2 && values.every(value => !Array.isArray(value));
                if (!valid)
                    throw new Error(`Invalid matrix dimensions: ${network.id}.`);
            }
            else if (network.data.edges.some(edge => !network.nodeIds.includes(edge.sourceId) || !network.nodeIds.includes(edge.targetId)))
                throw new Error(`Invalid edge in ${network.id}.`);
            const values = materializeNetworkMatrix(network);
            if (values.some((row, i) => row.some((value, j) => Number.isFinite(value) !== Number.isFinite(values[j]?.[i]) || (Number.isFinite(value) && value !== values[j]?.[i]))))
                throw new Error(`Asymmetric matrix: ${network.id}.`);
        }
    }
    const atlas = atlasSchema.parse(raw.atlas) as AtlasDefinition | null;
    if (atlas) {
        unique(atlas.nodes.map(node => node.id), 'atlas node');
        unique(atlas.nodes.map(node => String(node.index)), 'atlas index');
        if (atlas.nodes.some(node => node.index >= atlas.nodes.length))
            throw new Error('Invalid atlas index.');
    }
    const session = sessionSchema.parse(raw.session);
    const nodes = new Set([...(dataset?.nodeSet.nodes ?? []), ...(atlas?.nodes ?? [])].map(node => node.id));
    unique(session.atlasUi.order, 'active node');
    for (const id of session.atlasUi.order) {
        if (!nodes.has(id) || !session.atlasUi.labelsById[id])
            throw new Error(`Unknown session node: ${id}.`);
    }
    const annotations = session.visualizationUi.annotations;
    unique(annotations.map(item => item.id), 'annotation');
    if (!annotations.some(item => item.id === session.visualizationUi.currentAnnotationId))
        throw new Error('Unknown current annotation.');
    if (session.visualizationUi.activeAnnotationId !== null && !annotations.some(item => item.id === session.visualizationUi.activeAnnotationId))
        throw new Error('Unknown active annotation.');
    const annotationNodes = new Set([...nodes, ...Object.values(session.networkVisualization.temporaryNetworksById).flatMap(net => [...net.rowLabels, ...net.colLabels])]);
    for (const annotation of annotations) {
        const links = annotation.selectedLinks;
        unique(links.map(link => link.id), 'annotation link');
        unique(links.map(link => JSON.stringify([link.rowId, link.colId].sort())), 'undirected annotation link');
        unique(annotation.nodes.map(node => node.id), 'annotation node');
        if (links.some(link => !annotationNodes.has(link.rowId) || !annotationNodes.has(link.colId)) || annotation.nodes.some(node => !annotationNodes.has(node.id)))
            throw new Error('Annotation references an unknown node.');
        if (annotation.atlasLinkIds.some(id => !links.some(link => link.id === id)))
            throw new Error('Unknown annotation atlas link selection.');
        if (annotation.atlasNodeIds.some(id => !annotation.nodes.some(node => node.id === id)))
            throw new Error('Unknown annotation atlas node selection.');
    }
    const views = session.networkVisualization;
    unique(views.viewsOrder, 'view');
    const compounds = new Set(dataset?.networks.map(createNetworkCompoundId));
    if (Object.keys(views.viewsById).some(id => !views.viewsOrder.includes(id)))
        throw new Error('Unlisted workspace view.');
    for (const settings of [...Object.values(views.matrixSettingsByViewId), ...Object.values(views.nodeLinkSettingsByViewId)]) {
        if (settings.zoomIndex !== undefined && settings.zoomIndex >= (settings.zoomHistory?.length ?? 0))
            throw new Error('Invalid zoom history index.');
    }
    for (const id of views.viewsOrder) {
        const view = views.viewsById[id];
        if (!view || view.id !== id)
            throw new Error(`Missing view: ${id}.`);
        if (!(view.type === 'matrix' ? views.matrixSettingsByViewId[id] : views.nodeLinkSettingsByViewId[id])) {
            if (view.type === 'matrix')
                views.matrixSettingsByViewId[id] = {};
            else
                views.nodeLinkSettingsByViewId[id] = {};
        }
        if (view.temporaryNetworkId ? !views.temporaryNetworksById[view.temporaryNetworkId] : !compounds.has(view.compoundId))
            throw new Error(`Missing network for view ${id}.`);
    }
    for (const net of Object.values(views.temporaryNetworksById)) {
        if (net.data.length !== net.rowLabels.length || net.data.some(row => row.length !== net.colLabels.length))
            throw new Error('Invalid temporary matrix dimensions.');
    }
    if (session.networkLayout.layout.some(item => !views.viewsById[item.i]))
        throw new Error('Layout references an unknown view.');
    unique(session.rankings.resultsOrder, 'ranking');
    if (session.rankings.resultsOrder.some(id => !session.rankings.resultsById[id]))
        throw new Error('Missing ranking query.');
    for (const result of Object.values(session.rankings.resultsById)) {
        const ids = [...(result.query.networkIds ?? []), ...(result.query.networkId ? [result.query.networkId] : [])];
        if (ids.some(id => !dataset?.networkIndex[id]))
            throw new Error('Ranking references an unknown network.');
    }
    return { dataset, atlas, session };
};
