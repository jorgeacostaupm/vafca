import { normalizeConnectivityPackage } from "@/utils/import/normalizeConnectivityPackage";
import { readConnectivityZip } from "@/utils/import/readConnectivityZip";
import type {
  ConnectivityImportMode,
  ConnectivityImportResult,
} from "@/utils/import/types";

export const loadConnectivityImport = async (
  file: File,
  mode: ConnectivityImportMode,
): Promise<ConnectivityImportResult> => {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    throw new Error("Upload a ZIP dataset.");
  }

  const rawPackage = readConnectivityZip(file.name, await file.arrayBuffer());
  return normalizeConnectivityPackage(rawPackage, mode);
};

export const loadConnectivityImportFromBytes = (
  fileName: string,
  bytes: ArrayBuffer,
  mode: ConnectivityImportMode,
): ConnectivityImportResult => {
  if (!fileName.toLowerCase().endsWith(".zip")) {
    throw new Error("Upload a ZIP dataset.");
  }

  return normalizeConnectivityPackage(readConnectivityZip(fileName, bytes), mode);
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
