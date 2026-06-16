import { normalizeNetworkPackage } from "@/utils/import/normalizeNetworkPackage";
import { readNetworkZip } from "@/utils/import/readNetworkZip";
import type {
  NetworkImportMode,
  NetworkImportResult,
} from "@/utils/import/types";

export const loadNetworkImport = async (
  file: File,
  mode: NetworkImportMode,
): Promise<NetworkImportResult> => {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Upload a ZIP dataset.");
  }

  const rawPackage = readNetworkZip(file.name, await file.arrayBuffer());
  return normalizeNetworkPackage(rawPackage, mode);
};

export const loadNetworkImportFromBytes = (
  fileName: string,
  bytes: ArrayBuffer,
  mode: NetworkImportMode,
): NetworkImportResult => {
  if (!fileName.toLowerCase().endsWith(".zip")) {
    throw new Error("Upload a ZIP dataset.");
  }

  return normalizeNetworkPackage(readNetworkZip(fileName, bytes), mode);
};

export const downloadNormalizedDataset = (
  normalized: unknown,
  fileName = "normalized-dataset.json",
) => {
  const blob = new Blob([JSON.stringify(normalized, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
