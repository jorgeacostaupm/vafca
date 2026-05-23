import type { Atlas, ValidationResult } from "@/types/connectivityBundle";
import { isNonEmptyString, isRecord } from "@/utils/connectivityGuards";
import {
  addError,
  addWarning,
  createIssueBucket,
} from "@/utils/connectivityValidationTypes";

export const validateAtlas = (atlas: unknown): ValidationResult => {
  const bucket = createIssueBucket();
  const rois = isRecord(atlas) ? atlas.rois : null;

  if (!isRecord(atlas)) {
    addError(bucket, "atlas", "atlas must be an object.");
  } else {
    if (!isNonEmptyString(atlas.id)) addError(bucket, "atlas.id", "atlas.id is required.");
    if (!isNonEmptyString(atlas.name)) addError(bucket, "atlas.name", "atlas.name is required.");
    if (!isNonEmptyString(atlas.version)) {
      addError(bucket, "atlas.version", "atlas.version is required.");
    }
    if (!Array.isArray(rois)) addError(bucket, "atlas.rois", "atlas.rois must be an array.");
  }

  if (!Array.isArray(rois) || rois.length === 0) {
    addError(bucket, "atlas.rois", "atlas.rois must not be empty.");
    return toResult(bucket);
  }

  const indexes = new Set<number>();
  for (const [position, roi] of rois.entries()) {
    const path = `atlas.rois[${position}]`;
    if (!isRecord(roi)) {
      addError(bucket, path, "ROI must be an object.");
      continue;
    }
    const roiIndex = roi.index;
    if (typeof roiIndex !== "number" || !Number.isInteger(roiIndex) || roiIndex < 0) {
      addError(bucket, `${path}.index`, "roi.index must be an integer >= 0.");
    } else if (indexes.has(roiIndex)) {
      addError(bucket, `${path}.index`, `Duplicate roi.index '${roiIndex}'.`);
    } else {
      indexes.add(roiIndex);
    }
    if (!isNonEmptyString(roi.id)) addError(bucket, `${path}.id`, "roi.id is required.");
    if (roi.atlasId === undefined || roi.atlasId === null || roi.atlasId === "") {
      addError(bucket, `${path}.atlasId`, "roi.atlasId is required.");
    }
    if (!isNonEmptyString(roi.name)) addError(bucket, `${path}.name`, "roi.name is required.");
    if (!isNonEmptyString(roi.label)) addError(bucket, `${path}.label`, "roi.label is required.");
    if (!isRecord(roi.tags)) addError(bucket, `${path}.tags`, "roi.tags is required.");
    if (!isRecord(roi.metadata)) {
      addError(bucket, `${path}.metadata`, "roi.metadata is required.");
    }
  }

  for (let index = 0; index < rois.length; index += 1) {
    if (!indexes.has(index)) {
      addError(bucket, "atlas.rois", `roi.index range must cover 0..${rois.length - 1}.`);
      break;
    }
  }

  if (rois.every((roi) => isRecord(roi) && (roi.coords === null || roi.coords === undefined))) {
    addWarning(bucket, "atlas.rois.coords", "coords is null for all ROIs.");
  }
  return toResult(bucket);
};

const toResult = (
  bucket: ReturnType<typeof createIssueBucket>,
): ValidationResult => ({
  valid: bucket.errors.length === 0,
  errors: bucket.errors,
  warnings: bucket.warnings,
  summary: {
    matrixCount: 0,
    populationCount: 0,
    subjectCount: 0,
    layerCount: 0,
    measureCount: 0,
  },
});

export const isAtlas = (value: unknown): value is Atlas =>
  validateAtlas(value).errors.length === 0;
