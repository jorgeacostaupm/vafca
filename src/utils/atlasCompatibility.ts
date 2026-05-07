import type { AtlasDefinition } from "@/types/atlas";
import type { MatrixOrderItem } from "@/types/matrixOrder";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

export type AtlasCompatibilityResult =
  | { compatible: true; matrixRoiCount: number; atlasRoiCount: number }
  | {
      compatible: false;
      matrixRoiCount: number;
      atlasRoiCount: number;
      reason: string;
    };

const findMissingIds = (sourceIds: string[], targetIds: string[]) => {
  const targetSet = new Set(targetIds);
  return sourceIds.filter((id) => !targetSet.has(id));
};

const summarizeMissingIds = (missingIds: string[], sourceName: string) => {
  const shownIds = missingIds.slice(0, 5).join(", ");
  const suffix = missingIds.length > 5 ? ` and ${missingIds.length - 5} more` : "";
  return `${sourceName} is missing ROI id${missingIds.length === 1 ? "" : "s"}: ${shownIds}${suffix}.`;
};

export const checkAtlasMatrixCompatibility = (
  matrixOrder: MatrixOrderItem[] | undefined | null,
  atlas: AtlasDefinition | null | undefined,
): AtlasCompatibilityResult => {
  const matrixIds = normalizeMatrixOrder(matrixOrder).map((entry) => entry.id);
  const atlasIds = atlas?.rois.map((roi) => String(roi.id)) ?? [];

  if (matrixIds.length === 0 || atlasIds.length === 0) {
    return {
      compatible: true,
      matrixRoiCount: matrixIds.length,
      atlasRoiCount: atlasIds.length,
    };
  }

  if (matrixIds.length !== atlasIds.length) {
    return {
      compatible: false,
      matrixRoiCount: matrixIds.length,
      atlasRoiCount: atlasIds.length,
      reason: `Matrix order has ${matrixIds.length} ROIs, atlas has ${atlasIds.length} ROIs.`,
    };
  }

  const missingFromAtlas = findMissingIds(matrixIds, atlasIds);
  if (missingFromAtlas.length > 0) {
    return {
      compatible: false,
      matrixRoiCount: matrixIds.length,
      atlasRoiCount: atlasIds.length,
      reason: summarizeMissingIds(missingFromAtlas, "Atlas"),
    };
  }

  const missingFromMatrix = findMissingIds(atlasIds, matrixIds);
  if (missingFromMatrix.length > 0) {
    return {
      compatible: false,
      matrixRoiCount: matrixIds.length,
      atlasRoiCount: atlasIds.length,
      reason: summarizeMissingIds(missingFromMatrix, "Matrix order"),
    };
  }

  return {
    compatible: true,
    matrixRoiCount: matrixIds.length,
    atlasRoiCount: atlasIds.length,
  };
};
