import { isRecord, toSlug } from "@/utils/import/guards";
import {
  getImportMetadataFallbacks,
  normalizeCatalogs,
  normalizeManifest,
} from "@/utils/import/normalizeCatalogs";
import {
  createConnectivityStateFromNormalized,
  createMatrixOrderFromNormalized,
} from "@/utils/import/normalizedDatasetAdapter";
import { normalizeMatrices } from "@/utils/import/normalizeMatrices";
import { normalizeRois } from "@/utils/import/normalizeRois";
import type {
  ConnectivityImportMode,
  ConnectivityImportResult,
  NormalizedConnectivityDataset,
  NormalizedImportInference,
  RawConnectivityZipPackage,
} from "@/utils/import/types";
import { NORMALIZED_DATASET_SCHEMA_VERSION } from "@/utils/import/types";

const getDatasetName = (manifest: Record<string, unknown>, fileName: string) =>
  typeof manifest.name === "string" && manifest.name.trim()
    ? manifest.name.trim()
    : fileName.replace(/\.[^.]+$/, "");

const createEmptyInference = (): NormalizedImportInference => ({
  generatedRois: false,
  generatedRoiIds: [],
  generatedMatrixIds: [],
  inferredFields: [],
});

export const normalizeConnectivityPackage = (
  rawPackage: RawConnectivityZipPackage,
  mode: ConnectivityImportMode,
): ConnectivityImportResult => {
  const strict = mode === "strict";
  const errors = [...rawPackage.errors];
  const warnings = [...rawPackage.warnings];
  const inference = createEmptyInference();
  const manifest = normalizeManifest(rawPackage.manifest, strict, errors, warnings);
  const fallbacks = getImportMetadataFallbacks(manifest);
  const matrices = normalizeMatrices({
    matrixFiles: rawPackage.matrixFiles,
    fallbacks,
    errors,
    warnings,
    inference,
    strict,
  });
  const rois = normalizeRois({
    roisPayload: rawPackage.rois,
    matrices,
    errors,
    warnings,
    inference,
    strict,
  });
  const catalogs = normalizeCatalogs(
    rawPackage.catalogs,
    rawPackage.catalogFiles,
    matrices,
    errors,
  );
  const name = getDatasetName(manifest, rawPackage.fileName);
  const atlasId = isRecord(manifest) && typeof manifest.atlasId === "string"
    ? toSlug(manifest.atlasId, "imported-atlas")
    : "imported-atlas";

  const normalized: NormalizedConnectivityDataset = {
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
      rois,
    },
    catalogs,
    matrices,
    inference,
    issues: {
      errors,
      warnings,
    },
  };

  return {
    normalized,
    connectivity: createConnectivityStateFromNormalized(normalized),
    matrixOrder: createMatrixOrderFromNormalized(normalized),
  };
};
