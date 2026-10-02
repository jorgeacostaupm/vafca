import { loadSpatialAtlas } from '@/spatial/loadSpatialAtlas';
import { normalizeNetworkPackage } from "@/utils/import/normalizeNetworkPackage";
import { readNetworkZip } from "@/utils/import/readNetworkZip";
import type { RawNetworkPackage } from '@/utils/import/types';
import type { NetworkImportResult } from "@/utils/import/types";

const importPackage = async (raw: RawNetworkPackage): Promise<NetworkImportResult> => {
  const result = normalizeNetworkPackage(raw);
  if (!result.normalized.issues.errors.length) {
    const spatial = await loadSpatialAtlas(raw.spatialFiles ?? {}, result.dataset.nodeSet.nodes, raw.nodeMetadata);
    if (spatial) {
      result.dataset.nodeSet.spatial = spatial;
      result.normalized.issues.warnings.push(...spatial.warnings.map(message => ({ source: 'spatial/manifest.json', path: 'spatial', message })));
    }
  }
  return result;
};

export const loadNetworkImport = async (file: File): Promise<NetworkImportResult> =>
  loadNetworkImportFromBytes(file.name, await file.arrayBuffer());

export const loadNetworkImportFromBytes = async (fileName: string, bytes: ArrayBuffer): Promise<NetworkImportResult> => {
  if (!fileName.toLowerCase().endsWith('.zip')) throw new Error('Upload a ZIP dataset.');
  return importPackage(readNetworkZip(fileName, bytes));
};
