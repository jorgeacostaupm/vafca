import type { ConnectivityCatalogs } from "@/types/catalogs";
import type {
  ConnectivityImportIssue,
  NormalizedMatrix,
} from "@/utils/import/types";
import { isRecord, toLabel, toSlug } from "@/utils/import/guards";

type CatalogDefaults = {
  layer: string;
  measure: string;
  stat: string;
  population: string;
};

const readCatalogLabel = (
  catalogs: Record<string, unknown> | null,
  section: string,
  id: string,
) => {
  const sectionValue = catalogs?.[section];
  if (!isRecord(sectionValue)) return null;
  const entry = sectionValue[id];
  if (!isRecord(entry)) return null;
  return typeof entry.label === "string" && entry.label.trim()
    ? entry.label.trim()
    : null;
};

const readCatalogEntry = (
  catalogs: Record<string, unknown> | null,
  section: string,
  id: string,
) => {
  const sectionValue = catalogs?.[section];
  if (!isRecord(sectionValue)) return null;
  const entry = sectionValue[id];
  return isRecord(entry) ? entry : null;
};

const readExpectedRange = (
  catalogs: Record<string, unknown> | null,
  measureId: string,
) => {
  const entry = readCatalogEntry(catalogs, "measures", measureId) ??
    readCatalogEntry(catalogs, "stats", measureId);
  if (!entry || !Array.isArray(entry.expectedRange)) return null;
  const range = entry.expectedRange;
  if (
    range.length === 2 &&
    range.every((value) => typeof value === "number" && Number.isFinite(value)) &&
    range[0] <= range[1]
  ) {
    return [range[0], range[1]] as [number, number];
  }
  return null;
};

const isScaleType = (value: unknown) =>
  value === "sequential" || value === "diverging";

const isRangeMode = (value: unknown) =>
  value === "inherit_measure" ||
  value === "non_negative_observed" ||
  value === "observed" ||
  value === "observed_symmetric" ||
  value === "fixed";

const getDefaultStatConfig = (id: string) => {
  if (id === "std") {
    return {
      category: "dispersion",
      scaleType: "sequential" as const,
      center: null,
      rangeMode: "non_negative_observed" as const,
    };
  }
  if (id.includes("z") || id.includes("difference")) {
    return {
      category: "comparison",
      scaleType: "diverging" as const,
      center: 0,
      rangeMode: "observed_symmetric" as const,
    };
  }
  return {
    category: "imported",
    scaleType: "sequential" as const,
    center: null,
    rangeMode: "inherit_measure" as const,
  };
};

const getCatalogRecord = (
  payload: unknown,
  errors: ConnectivityImportIssue[],
) => {
  if (payload === null) return null;
  if (isRecord(payload)) return payload;
  errors.push({
    source: "catalogs.json",
    path: "catalogs.json",
    message: "catalogs.json must contain an object.",
  });
  return null;
};

export const getDefaultsFromManifest = (
  manifestPayload: unknown,
): CatalogDefaults => {
  const fallback = {
    layer: "default",
    measure: "connectivity",
    stat: "value",
    population: "dataset",
  };
  if (!isRecord(manifestPayload) || !isRecord(manifestPayload.defaults)) {
    return fallback;
  }

  const defaults = manifestPayload.defaults;
  return {
    layer: typeof defaults.layer === "string" ? defaults.layer : fallback.layer,
    measure: typeof defaults.measure === "string" ? defaults.measure : fallback.measure,
    stat: typeof defaults.stat === "string" ? defaults.stat : fallback.stat,
    population:
      typeof defaults.population === "string"
        ? defaults.population
        : fallback.population,
  };
};

export const normalizeManifest = (
  manifestPayload: unknown,
  strict: boolean,
  errors: ConnectivityImportIssue[],
  warnings: ConnectivityImportIssue[],
) => {
  if (manifestPayload === null) {
    const issue = {
      source: "manifest.json",
      path: "manifest.json",
      message: "manifest.json is missing; using import defaults.",
    };
    if (strict) errors.push(issue);
    else warnings.push(issue);
    return {};
  }
  if (!isRecord(manifestPayload)) {
    errors.push({
      source: "manifest.json",
      path: "manifest.json",
      message: "manifest.json must contain an object.",
    });
    return {};
  }
  if (strict && manifestPayload.formatVersion !== "vafca-zip-v1") {
    errors.push({
      source: "manifest.json",
      path: "manifest.json.formatVersion",
      message: "Strict import requires formatVersion='vafca-zip-v1'.",
    });
  }
  return manifestPayload;
};

export const normalizeCatalogs = (
  catalogsPayload: unknown,
  catalogFiles: Record<string, unknown>,
  matrices: NormalizedMatrix[],
  errors: ConnectivityImportIssue[],
): ConnectivityCatalogs => {
  const sourceCatalogs = {
    ...(getCatalogRecord(catalogsPayload, errors) ?? {}),
    ...Object.fromEntries(
      Object.entries(catalogFiles).filter(([, value]) => {
        if (value === null || isRecord(value)) return true;
        errors.push({
          source: "catalogs",
          path: "catalogs",
          message: "Catalog files must contain JSON objects.",
        });
        return false;
      }),
    ),
  };
  const layerIds = new Set(matrices.map((matrix) => matrix.layerId));
  const measureIds = new Set(matrices.map((matrix) => matrix.measureId));
  const statIds = new Set(matrices.map((matrix) => matrix.statId));
  const populationIds = new Set(matrices.flatMap((matrix) => matrix.populationIds));

  return {
    layers: Object.fromEntries(
      [...layerIds].map((id) => [
        id,
        {
          id,
          label: readCatalogLabel(sourceCatalogs, "layers", id) ?? toLabel(id),
          enabled: true,
        },
      ]),
    ),
    measures: Object.fromEntries(
      [...measureIds].map((id) => {
        const expectedRange = readExpectedRange(sourceCatalogs, id);
        return [
          id,
          {
            id,
            label: readCatalogLabel(sourceCatalogs, "measures", id) ?? toLabel(id),
            expectedRange,
            min: expectedRange?.[0],
            max: expectedRange?.[1],
            enabled: true,
          },
        ];
      }),
    ),
    stats: Object.fromEntries(
      [...statIds].map((id) => {
        const entry = readCatalogEntry(sourceCatalogs, "stats", id);
        const defaults = getDefaultStatConfig(id);
        const expectedRange = readExpectedRange(sourceCatalogs, id);
        return [
          id,
          {
          id,
          label: readCatalogLabel(sourceCatalogs, "stats", id) ?? toLabel(id),
          category: typeof entry?.category === "string" ? entry.category : defaults.category,
          scaleType: isScaleType(entry?.scaleType) ? entry.scaleType : defaults.scaleType,
          center: typeof entry?.center === "number" || entry?.center === null
            ? entry.center
            : defaults.center,
          rangeMode: isRangeMode(entry?.rangeMode) ? entry.rangeMode : defaults.rangeMode,
          expectedRange,
          enabled: true,
          useDataRange: entry?.useDataRange === true,
        }];
      }),
    ),
    populations: Object.fromEntries(
      [...populationIds].map((id) => [
        id,
        {
          id: toSlug(id, "dataset"),
          label: readCatalogLabel(sourceCatalogs, "populations", id) ?? toLabel(id),
          enabled: true,
        },
      ]),
    ),
  };
};
