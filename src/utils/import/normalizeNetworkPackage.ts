import {
  createNetworkDatasetFromDraft,
  createNodeOrderFromDraft,
} from "@/utils/import/networkDatasetFactory";
import { normalizeCatalogs } from "@/utils/import/normalizeCatalogs";
import { normalizeMatrixNetworks } from "@/utils/import/normalizeMatrixNetworks";
import { normalizeNodes } from "@/utils/import/normalizeNodes";
import type {
  NetworkDatasetDraft,
  NetworkImportInference,
  NetworkImportResult,
  RawNetworkPackage,
} from "@/utils/import/types";
import { NORMALIZED_DATASET_SCHEMA_VERSION } from "@/utils/import/types";

const createEmptyInference = (): NetworkImportInference => ({
  generatedNodes: false,
  generatedNodeIds: [],
  generatedNetworkIds: [],
  inferredFields: [],
});

export const normalizeNetworkPackage = (
  rawPackage: RawNetworkPackage,
): NetworkImportResult => {
  const errors = [...rawPackage.errors];
  const warnings = [...rawPackage.warnings];
  const inference = createEmptyInference();
  const networks = normalizeMatrixNetworks({
    matrixFiles: rawPackage.matrixFiles,
    errors,
    warnings,
    inference,
  });
  const nodes = normalizeNodes({
    nodeMetadataPayload: rawPackage.nodeMetadata,
    networks,
    errors,
    inference,
  });
  const catalogs = normalizeCatalogs(
    rawPackage.catalogs,
    rawPackage.catalogFiles,
    networks,
    errors,
  );
  const name = rawPackage.fileName.replace(/\.[^.]+$/, "");

  const normalized: NetworkDatasetDraft = {
    schemaVersion: NORMALIZED_DATASET_SCHEMA_VERSION,
    source: {
      format: "zip",
      fileName: rawPackage.fileName,
      importedAt: new Date().toISOString(),
    },
    atlas: {
      id: "imported-atlas",
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
