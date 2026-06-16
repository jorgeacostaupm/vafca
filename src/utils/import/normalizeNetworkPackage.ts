import { isRecord, toSlug } from "@/utils/import/guards";
import {
  createNetworkDatasetFromDraft,
  createNodeOrderFromDraft,
} from "@/utils/import/networkDatasetFactory";
import {
  getImportMetadataFallbacks,
  normalizeCatalogs,
  normalizeManifest,
} from "@/utils/import/normalizeCatalogs";
import { normalizeMatrixNetworks } from "@/utils/import/normalizeMatrixNetworks";
import { normalizeNodes } from "@/utils/import/normalizeNodes";
import type {
  NetworkDatasetDraft,
  NetworkImportInference,
  NetworkImportMode,
  NetworkImportResult,
  RawNetworkPackage,
} from "@/utils/import/types";
import { NORMALIZED_DATASET_SCHEMA_VERSION } from "@/utils/import/types";

const getDatasetName = (manifest: Record<string, unknown>, fileName: string) =>
  typeof manifest.name === "string" && manifest.name.trim()
    ? manifest.name.trim()
    : fileName.replace(/\.[^.]+$/, "");

const createEmptyInference = (): NetworkImportInference => ({
  generatedNodes: false,
  generatedNodeIds: [],
  generatedNetworkIds: [],
  inferredFields: [],
});

export const normalizeNetworkPackage = (
  rawPackage: RawNetworkPackage,
  mode: NetworkImportMode,
): NetworkImportResult => {
  const strict = mode === "strict";
  const errors = [...rawPackage.errors];
  const warnings = [...rawPackage.warnings];
  const inference = createEmptyInference();
  const manifest = normalizeManifest(rawPackage.manifest, strict, errors, warnings);
  const fallbacks = getImportMetadataFallbacks(manifest);
  const networks = normalizeMatrixNetworks({
    matrixFiles: rawPackage.matrixFiles,
    fallbacks,
    errors,
    warnings,
    inference,
    strict,
  });
  const nodes = normalizeNodes({
    nodeMetadataPayload: rawPackage.nodeMetadata,
    networks,
    errors,
    warnings,
    inference,
    strict,
  });
  const catalogs = normalizeCatalogs(
    rawPackage.catalogs,
    rawPackage.catalogFiles,
    networks,
    errors,
  );
  const name = getDatasetName(manifest, rawPackage.fileName);
  const atlasId = isRecord(manifest) && typeof manifest.atlasId === "string"
    ? toSlug(manifest.atlasId, "imported-atlas")
    : "imported-atlas";

  const normalized: NetworkDatasetDraft = {
    schemaVersion: NORMALIZED_DATASET_SCHEMA_VERSION,
    source: {
      format: "zip",
      fileName: rawPackage.fileName,
      importedAt: new Date().toISOString(),
      importMode: mode,
    },
    manifest,
    atlas: {
      id: atlasId,
      name,
      nodes,
    },
    catalogs,
    networks,
    inference,
    issues: {
      errors,
      warnings,
    },
  };

  return {
    normalized,
    dataset: createNetworkDatasetFromDraft(normalized),
    nodeOrder: createNodeOrderFromDraft(normalized),
  };
};
