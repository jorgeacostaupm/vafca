import { isRecord, toLabel, toSlug } from "@/utils/import/guards";
import { parseCatalogsImportRecord } from "@/utils/import/schemas/catalogSchema";
import { parseManifestImportRecord } from "@/utils/import/schemas/manifestSchema";
import type {
  CatalogsDraft,
  ImportedNetworkDraft,
  NetworkImportIssue,
} from "@/utils/import/types";

export type ImportMetadataFallbacks = {
  symmetric: boolean;
};

const readCatalogLabel = (
  catalogs: Record<string, unknown> | null,
  section: string,
  id: string,
) => {
  const sectionValue = catalogs?.[section] ??
    (section === "statistics" ? catalogs?.stats : undefined);
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
  const sectionValue = catalogs?.[section] ??
    (section === "statistics" ? catalogs?.stats : undefined);
  if (!isRecord(sectionValue)) return null;
  const entry = sectionValue[id];
  return isRecord(entry) ? entry : null;
};

const readExpectedRange = (
  catalogs: Record<string, unknown> | null,
  measureId: string,
) => {
  const entry = readCatalogEntry(catalogs, "measures", measureId) ??
    readCatalogEntry(catalogs, "statistics", measureId);
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
  errors: NetworkImportIssue[],
) => {
  if (payload === null) return null;
  return parseCatalogsImportRecord(payload, "catalogs.json", errors);
};

export const getImportMetadataFallbacks = (
  manifestPayload: unknown,
): ImportMetadataFallbacks => {
  const directedNetworks =
    isRecord(manifestPayload) && typeof manifestPayload.directedNetworks === "boolean"
      ? manifestPayload.directedNetworks
      : false;
  return { symmetric: !directedNetworks };
};

export const normalizeManifest = (
  manifestPayload: unknown,
  strict: boolean,
  errors: NetworkImportIssue[],
  warnings: NetworkImportIssue[],
) => {
  if (manifestPayload === null) {
    const issue = {
      source: "manifest.json",
      path: "manifest.json",
      message: "manifest.json is missing; using internal import fallbacks.",
    };
    if (strict) errors.push(issue);
    else warnings.push(issue);
    return {};
  }
  const manifest = parseManifestImportRecord(manifestPayload, "manifest.json", errors);
  if (!manifest) {
    return {};
  }
  if (strict && manifest.formatVersion !== "vafca-zip-v1") {
    errors.push({
      source: "manifest.json",
      path: "manifest.json.formatVersion",
      message: "Strict import requires formatVersion='vafca-zip-v1'.",
    });
  }
  return manifest;
};

export const normalizeCatalogs = (
  catalogsPayload: unknown,
  catalogFiles: Record<string, unknown>,
  networks: ImportedNetworkDraft[],
  errors: NetworkImportIssue[],
): CatalogsDraft => {
  const sourceCatalogs = {
    ...(getCatalogRecord(catalogsPayload, errors) ?? {}),
    ...Object.fromEntries(
      Object.entries(catalogFiles).filter(([, value]) => {
        return value === null ||
          parseCatalogsImportRecord(value, "catalogs", errors) !== null;
      }),
    ),
  };
  const layerIds = new Set(networks.map((network) => network.layerId));
  const measureIds = new Set(networks.map((network) => network.measureId));
  const statisticIds = new Set(networks.map((network) => network.statisticId));
  const populationIds = new Set(networks.flatMap((network) => network.populationIds));

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
    statistics: Object.fromEntries(
      [...statisticIds].map((id) => {
        const entry = readCatalogEntry(sourceCatalogs, "statistics", id);
        const defaults = getDefaultStatConfig(id);
        const expectedRange = readExpectedRange(sourceCatalogs, id);
        return [
          id,
          {
          id,
          label: readCatalogLabel(sourceCatalogs, "statistics", id) ?? toLabel(id),
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
