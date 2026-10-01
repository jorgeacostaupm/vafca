import { strFromU8, strToU8, unzip, zip } from 'fflate';

import { WORKSPACE_MAX_BYTES, WORKSPACE_MAX_JSON_DEPTH } from '@/config/ui';
import { loadSpatialAtlas } from '@/spatial/loadSpatialAtlas';

import { decodeDatasetEntries, encodeDatasetEntries } from './datasetArchive';

const format = 'vafca-workspace-v2';
const paths = ['session.json'];
const json = (value: unknown) => strToU8(JSON.stringify(value));
const parse = (bytes: Uint8Array) => {
    const value: unknown = JSON.parse(strFromU8(bytes), (key, entry) => {
        if (['__proto__', 'constructor', 'prototype'].includes(key))
            throw new Error('Unsafe workspace key.');
        return entry;
    });
    const checkDepth = (entry: unknown, depth: number) => {
        if (depth > WORKSPACE_MAX_JSON_DEPTH)
            throw new Error('Workspace nesting is too deep.');
        if (entry && typeof entry === 'object')
            Object.values(entry).forEach(child => checkDepth(child, depth + 1));
    };
    checkDepth(value, 0);
    return value;
};
export const encodeWorkspace = async (payload: {
    dataset: unknown;
    atlas: unknown;
    session: unknown;
}) => {
    const { entries: dataEntries, metadata } = encodeDatasetEntries(payload.dataset as Parameters<typeof encodeDatasetEntries>[0]);
    const entries = {
        ...dataEntries,
        'session.json': json({ formatVersion: format, createdAt: new Date().toISOString(),
            dataset: metadata, atlas: payload.atlas, state: payload.session }),
    };
    if (Object.values(entries).reduce((sum, entry) => sum + entry.length, 0) > WORKSPACE_MAX_BYTES)
        throw new Error('Workspace exceeds the supported size (256 MB uncompressed).');
    return new Promise<Uint8Array>((resolve, reject) => zip(entries, { level: 6 }, (error, bytes) => error ? reject(error) : resolve(bytes)));
};
export const decodeWorkspace = async (bytes: Uint8Array) => {
    if (bytes.byteLength > WORKSPACE_MAX_BYTES)
        throw new Error('Workspace file is too large.');
    let total = 0;
    let invalid = false;
    const seen = new Set<string>();
    const files = await new Promise<Record<string, Uint8Array>>((resolve, reject) => unzip(bytes, {
        filter: entry => {
            total += entry.originalSize;
            if (seen.has(entry.name))
                invalid = true;
            seen.add(entry.name);
            if ((!paths.includes(entry.name) && !['matrices.json', 'rois.json'].includes(entry.name) && !/^catalogs\/[^/]+\.json$/.test(entry.name) && !/^spatial\/(?!.*(?:^|\/)\.\.?\/)[a-zA-Z0-9_./ -]+$/.test(entry.name)) || total > WORKSPACE_MAX_BYTES) {
                invalid = true;
                return false;
            }
            return true;
        },
    }, (error, entries) => error ? reject(error) : resolve(entries)));
    if (invalid || !files['session.json'])
        throw new Error('Invalid or oversized workspace archive.');
    const session = parse(files['session.json']) as {
        formatVersion?: string; dataset: ReturnType<typeof encodeDatasetEntries>['metadata']; atlas: import('@/types/atlas').AtlasDefinition | null; state: unknown;
    };
    if (session?.formatVersion !== format) throw new Error('Unsupported workspace version.');
    const data = Object.fromEntries(Object.entries(files).filter(([path]) => path !== 'session.json' && !path.startsWith('spatial/')).map(([path, bytes]) => [path, parse(bytes)]));
    const dataset = decodeDatasetEntries(data, session.dataset);
    if (dataset) {
        const spatial = await loadSpatialAtlas(files, dataset.nodeSet.nodes, data['rois.json']);
        dataset.nodeSet.spatial = spatial;
        if (session.atlas) session.atlas.spatial = spatial;
    }
    return { dataset, atlas: session.atlas, session: session.state };
};
