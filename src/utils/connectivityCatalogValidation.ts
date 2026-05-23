import type { Catalogs, ValidationResult } from "@/types/connectivityBundle";
import {
  isFiniteNumber,
  isNonEmptyString,
  isPositiveInteger,
  isRecord,
} from "@/utils/connectivityGuards";
import { addError, createIssueBucket } from "@/utils/connectivityValidationTypes";

const requiredCatalogKeys = [
  "layers",
  "measures",
  "stats",
  "populations",
  "subjects",
  "roiGroupSchemes",
] as const;

const validateKeyedId = (
  bucket: ReturnType<typeof createIssueBucket>,
  catalog: string,
  key: string,
  entry: unknown,
) => {
  if (!isRecord(entry)) {
    addError(bucket, `catalogs.${catalog}.${key}`, "Catalog entry must be an object.");
    return false;
  }
  if (entry.id !== key) {
    addError(
      bucket,
      `catalogs.${catalog}.${key}.id`,
      "Catalog object key must match its internal id.",
    );
  }
  return true;
};

export const validateCatalogs = (catalogs: unknown): ValidationResult => {
  const bucket = createIssueBucket();
  if (!isRecord(catalogs)) {
    addError(bucket, "catalogs", "catalogs must be an object.");
    return toResult(bucket, catalogs);
  }

  for (const key of requiredCatalogKeys) {
    if (!isRecord(catalogs[key])) {
      addError(bucket, `catalogs.${key}`, `catalogs.${key} is required.`);
    }
  }

  validateLayers(bucket, catalogs);
  validateMeasures(bucket, catalogs);
  validateStats(bucket, catalogs);
  validatePopulations(bucket, catalogs);
  validateSubjects(bucket, catalogs);

  return toResult(bucket, catalogs);
};

const validateLayers = (
  bucket: ReturnType<typeof createIssueBucket>,
  catalogs: Record<string, unknown>,
) => {
  if (!isRecord(catalogs.layers)) return;
  for (const [key, entry] of Object.entries(catalogs.layers)) {
    if (!validateKeyedId(bucket, "layers", key, entry) || !isRecord(entry)) continue;
    if (!isNonEmptyString(entry.label)) {
      addError(bucket, `catalogs.layers.${key}.label`, "layer.label is required.");
    }
  }
};

const validateMeasures = (
  bucket: ReturnType<typeof createIssueBucket>,
  catalogs: Record<string, unknown>,
) => {
  if (!isRecord(catalogs.measures)) return;
  for (const [key, entry] of Object.entries(catalogs.measures)) {
    if (!validateKeyedId(bucket, "measures", key, entry) || !isRecord(entry)) continue;
    if (!isNonEmptyString(entry.label)) {
      addError(bucket, `catalogs.measures.${key}.label`, "measure.label is required.");
    }
    if (!isExpectedRange(entry.expectedRange)) {
      addError(
        bucket,
        `catalogs.measures.${key}.expectedRange`,
        "measure.expectedRange must be [min, max] or null.",
      );
    }
    if (typeof entry.symmetric !== "boolean") {
      addError(bucket, `catalogs.measures.${key}.symmetric`, "measure.symmetric is required.");
    }
    if (typeof entry.directed !== "boolean") {
      addError(bucket, `catalogs.measures.${key}.directed`, "measure.directed is required.");
    }
  }
};

const validateStats = (
  bucket: ReturnType<typeof createIssueBucket>,
  catalogs: Record<string, unknown>,
) => {
  if (!isRecord(catalogs.stats)) return;
  for (const [key, entry] of Object.entries(catalogs.stats)) {
    if (!validateKeyedId(bucket, "stats", key, entry) || !isRecord(entry)) continue;
    if (!isNonEmptyString(entry.label)) {
      addError(bucket, `catalogs.stats.${key}.label`, "stat.label is required.");
    }
    if (!["sequential", "diverging"].includes(String(entry.scaleType))) {
      addError(bucket, `catalogs.stats.${key}.scaleType`, "stat.scaleType is invalid.");
    }
    if (entry.center !== null && !isFiniteNumber(entry.center)) {
      addError(bucket, `catalogs.stats.${key}.center`, "stat.center must be number or null.");
    }
    if (
      ![
        "inherit_measure",
        "non_negative_observed",
        "observed",
        "observed_symmetric",
        "fixed",
      ].includes(String(entry.rangeMode))
    ) {
      addError(bucket, `catalogs.stats.${key}.rangeMode`, "stat.rangeMode is invalid.");
    }
    if (entry.expectedRange !== undefined && !isExpectedRange(entry.expectedRange)) {
      addError(
        bucket,
        `catalogs.stats.${key}.expectedRange`,
        "stat.expectedRange must be [min, max] or null.",
      );
    }
  }
};

const isExpectedRange = (value: unknown) =>
  value === null ||
  (Array.isArray(value) &&
    value.length === 2 &&
    value.every(isFiniteNumber) &&
    value[0] <= value[1]);

const validatePopulations = (
  bucket: ReturnType<typeof createIssueBucket>,
  catalogs: Record<string, unknown>,
) => {
  if (!isRecord(catalogs.populations)) return;
  for (const [key, entry] of Object.entries(catalogs.populations)) {
    if (!validateKeyedId(bucket, "populations", key, entry) || !isRecord(entry)) continue;
    if (!isNonEmptyString(entry.label)) {
      addError(bucket, `catalogs.populations.${key}.label`, "population.label is required.");
    }
    if (entry.n !== undefined && !isPositiveInteger(entry.n)) {
      addError(bucket, `catalogs.populations.${key}.n`, "population.n must be integer > 0.");
    }
    if (!isRecord(entry.metadata)) {
      addError(bucket, `catalogs.populations.${key}.metadata`, "population.metadata is required.");
    }
  }
};

const validateSubjects = (
  bucket: ReturnType<typeof createIssueBucket>,
  catalogs: Record<string, unknown>,
) => {
  if (!isRecord(catalogs.subjects) || !isRecord(catalogs.populations)) return;
  for (const [key, entry] of Object.entries(catalogs.subjects)) {
    if (!validateKeyedId(bucket, "subjects", key, entry) || !isRecord(entry)) continue;
    if (!isNonEmptyString(entry.label)) {
      addError(bucket, `catalogs.subjects.${key}.label`, "subject.label is required.");
    }
    if (!Array.isArray(entry.populationIds)) {
      addError(
        bucket,
        `catalogs.subjects.${key}.populationIds`,
        "subject.populationIds is required.",
      );
    } else {
      for (const populationId of entry.populationIds) {
        if (typeof populationId !== "string" || !catalogs.populations[populationId]) {
          addError(
            bucket,
            `catalogs.subjects.${key}.populationIds`,
            `Unknown populationId '${String(populationId)}'.`,
          );
        }
      }
    }
    if (!isRecord(entry.metadata)) {
      addError(bucket, `catalogs.subjects.${key}.metadata`, "subject.metadata is required.");
    }
  }
};

const toResult = (
  bucket: ReturnType<typeof createIssueBucket>,
  catalogs: unknown,
): ValidationResult => ({
  valid: bucket.errors.length === 0,
  errors: bucket.errors,
  warnings: bucket.warnings,
  summary: {
    matrixCount: 0,
    populationCount: isRecord(catalogs) && isRecord(catalogs.populations)
      ? Object.keys(catalogs.populations).length
      : 0,
    subjectCount: isRecord(catalogs) && isRecord(catalogs.subjects)
      ? Object.keys(catalogs.subjects).length
      : 0,
    layerCount: isRecord(catalogs) && isRecord(catalogs.layers)
      ? Object.keys(catalogs.layers).length
      : 0,
    measureCount: isRecord(catalogs) && isRecord(catalogs.measures)
      ? Object.keys(catalogs.measures).length
      : 0,
  },
});

export const isCatalogs = (value: unknown): value is Catalogs =>
  validateCatalogs(value).errors.length === 0;
