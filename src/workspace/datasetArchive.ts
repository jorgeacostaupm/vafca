import { strToU8 } from 'fflate';

import { getSpatialFiles } from '@/spatial/loadSpatialAtlas';
import type { NetworkDataset } from '@/types/network';
import { normalizeNetworkPackage } from '@/utils/import/normalizeNetworkPackage';
import { materializeNetworkMatrix } from '@/utils/networkData';

const json = (value: unknown) => strToU8(JSON.stringify(value));

export const encodeDatasetEntries = (dataset: Omit<NetworkDataset, 'networkIndex'> | null) => {
    if (!dataset) return { entries: {}, metadata: null };
    const { networks, nodeSet, catalogs, ...identity } = dataset;
    const { nodes, ...nodeSetIdentity } = nodeSet;
    const compatible = networks.filter(network => network.nodeIds.length === nodes.length && network.nodeIds.every((id, i) => id === nodes[i].id));
    const compatibleIds = new Set(compatible.map(network => network.id));
    const spatial = nodeSet.spatial;
    const field = spatial?.manifest.atlas?.mapping.roi_field;
    const entries: Record<string, Uint8Array> = {
        ...getSpatialFiles(spatial),
        'matrices.json': json(compatible.map(network => ({
            id: network.id, label: network.label, source: network.sourceId,
            measure: network.measureId, statistic: network.statisticId, dimensions: network.dimensions,
            layout: network.data.format === 'matrix' ? network.data.layout : 'full',
            data: network.data.format === 'matrix' ? network.data.values : materializeNetworkMatrix(network),
        }))),
        'rois.json': json(nodes.map((node, index) => ({ ...node, index, ...(field && field !== 'id' && Object.hasOwn(spatial!.mappingValues, node.id) ? { [field]: spatial!.mappingValues[node.id] } : {}) }))),
        'catalogs/dimensions.json': json({ core: catalogs.core, aspects: catalogs.aspects }),
        'catalogs/sources.json': json(catalogs.sources),
        'catalogs/measures.json': json(catalogs.measures),
        'catalogs/statistics.json': json(catalogs.statistics),
    };
    for (const [id, catalog] of Object.entries(catalogs.aspectCatalogs)) {
        if (!/^[^/\\.]+$/.test(id) || ['dimensions', 'sources', 'measures', 'statistics'].includes(id))
            throw new Error(`Dimension cannot be exported as a catalog: ${id}.`);
        entries[`catalogs/${id}.json`] = json(catalog);
    }
    return { entries, metadata: {
        ...identity, nodeSet: nodeSetIdentity,
        // Aggregations with their own ROI order belong to the analysis session.
        networks: networks.map(network => compatibleIds.has(network.id) && network.data.format === 'matrix'
            ? { ...network, data: { ...network.data, values: undefined } } : network),
    } };
};

export const decodeDatasetEntries = (files: Record<string, unknown>, metadata: ReturnType<typeof encodeDatasetEntries>['metadata']) => {
    if (!metadata) {
        if (files['matrices.json']) throw new Error('Missing workspace dataset metadata.');
        return null;
    }
    const matrices = files['matrices.json'];
    if (!Array.isArray(matrices)) throw new Error('Missing workspace matrices.');
    const imported = normalizeNetworkPackage({
        fileName: 'workspace.zip', files: Object.keys(files), catalogs: null,
        catalogFiles: Object.fromEntries(Object.entries(files).filter(([path]) => path.startsWith('catalogs/')).map(([path, value]) => [path.slice(9, -5), value])),
        nodeMetadata: files['rois.json'],
        matrixFiles: matrices.map((payload, i) => ({ source: `matrices.json[${i}]`, payload })),
        errors: [], warnings: [],
    });
    if (imported.normalized.issues.errors.length) throw new Error(imported.normalized.issues.errors.map(issue => issue.message).join('\n'));
    const values = new Map(matrices.map(matrix => [matrix.id, matrix.data]));
    return { ...imported.dataset, ...metadata,
        nodeSet: { ...metadata.nodeSet, nodes: imported.dataset.nodeSet.nodes },
        networks: metadata.networks.map(network => ({ ...network, data: network.data.format === 'matrix' && network.data.values === undefined
            ? { ...network.data, values: values.get(network.id) } : network.data })),
    };
};
