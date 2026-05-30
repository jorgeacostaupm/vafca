import { strFromU8, unzipSync } from "fflate";
import type {
  ConnectivityImportIssue,
  RawConnectivityZipPackage,
  RawZipMatrixFile,
} from "@/utils/import/types";

const decoder = new TextDecoder("utf-8", { fatal: false });

const isJsonFile = (path: string) => path.toLowerCase().endsWith(".json");

const normalizePath = (path: string) => path.replace(/^\/+/, "");

const readJson = (
  files: Record<string, Uint8Array>,
  path: string,
  issues: ConnectivityImportIssue[],
) => {
  try {
    return JSON.parse(decoder.decode(files[path])) as unknown;
  } catch (error) {
    issues.push({
      source: path,
      path,
      message: error instanceof Error ? error.message : "Invalid JSON file.",
    });
    return null;
  }
};

export const readConnectivityZip = (
  fileName: string,
  bytes: ArrayBuffer,
): RawConnectivityZipPackage => {
  const errors: ConnectivityImportIssue[] = [];
  const warnings: ConnectivityImportIssue[] = [];
  let zipEntries: Record<string, Uint8Array> = {};

  try {
    zipEntries = unzipSync(new Uint8Array(bytes));
  } catch (error) {
    errors.push({
      source: fileName,
      path: "",
      message: error instanceof Error ? error.message : "The file is not a valid ZIP.",
    });
  }

  const files = Object.fromEntries(
    Object.entries(zipEntries)
      .map(([path, content]) => [normalizePath(path), content] as const)
      .filter(([path]) => path && !path.endsWith("/") && !path.startsWith("__MACOSX/")),
  );
  const paths = Object.keys(files).sort();

  const hasMatricesJson = paths.includes("matrices.json");
  const matrixFolderFiles = paths.filter(
    (path) => path.startsWith("matrices/") && isJsonFile(path),
  );
  const catalogFolderFiles = paths.filter(
    (path) => path.startsWith("catalogs/") && isJsonFile(path),
  );

  if (hasMatricesJson && matrixFolderFiles.length > 0) {
    errors.push({
      source: fileName,
      path: "matrices",
      message: "Use either matrices.json or matrices/ JSON files, not both.",
    });
  }
  if (!hasMatricesJson && matrixFolderFiles.length === 0) {
    errors.push({
      source: fileName,
      path: "matrices",
      message: "The ZIP must include matrices.json or at least one matrices/*.json file.",
    });
  }
  if (paths.includes("catalogs.json") && catalogFolderFiles.length > 0) {
    errors.push({
      source: fileName,
      path: "catalogs",
      message: "Use either catalogs.json or catalogs/ JSON files, not both.",
    });
  }

  const matrixFiles: RawZipMatrixFile[] = [];
  if (hasMatricesJson) {
    const payload = readJson(files, "matrices.json", errors);
    const matrices = Array.isArray(payload) ? payload : payload === null ? [] : [payload];
    matrices.forEach((matrix, index) => {
      matrixFiles.push({ source: `matrices.json[${index}]`, payload: matrix });
    });
  } else {
    matrixFolderFiles.forEach((path) => {
      matrixFiles.push({ source: path, payload: readJson(files, path, errors) });
    });
  }

  const unsupportedJsonFiles = paths.filter(
    (path) =>
      isJsonFile(path) &&
      !["manifest.json", "catalogs.json", "rois.json", "matrices.json"].includes(path) &&
      !path.startsWith("matrices/") &&
      !path.startsWith("catalogs/"),
  );
  unsupportedJsonFiles.forEach((path) => {
    warnings.push({
      source: path,
      path,
      message: "JSON file ignored because it is not part of the import format.",
    });
  });

  const catalogFiles = Object.fromEntries(
    catalogFolderFiles.map((path) => [
      path.replace(/^catalogs\//, "").replace(/\.json$/i, ""),
      readJson(files, path, errors),
    ]),
  );

  return {
    fileName,
    files: paths,
    manifest: paths.includes("manifest.json") ? readJson(files, "manifest.json", errors) : null,
    catalogs: paths.includes("catalogs.json") ? readJson(files, "catalogs.json", errors) : null,
    catalogFiles,
    rois: paths.includes("rois.json") ? readJson(files, "rois.json", errors) : null,
    matrixFiles,
    errors,
    warnings,
  };
};

export const readTextFromZipEntry = (entry: Uint8Array) => strFromU8(entry);
