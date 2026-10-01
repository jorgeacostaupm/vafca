import type {
  AspectDefinition,
  CatalogItem,
  CoreAspectId,
  RangeMode,
  ScaleType,
  SourceKind,
} from "@/types/network";
import { isRecord, toLabel } from "@/utils/import/guards";
import { parseCatalogsImportRecord } from "@/utils/import/schemas/catalogSchema";
import type {
  CatalogItemDraft,
  CatalogsDraft,
  ImportedNetworkDraft,
  NetworkImportIssue,
  SourceDraft,
} from "@/utils/import/types";

const CORE_IDS: CoreAspectId[] = ["source", "measure", "statistic"];

const isScaleType = (value: unknown): value is ScaleType =>
  value === "sequential" || value === "diverging";

const isRangeMode = (value: unknown): value is RangeMode =>
  value === "inherit_measure" ||
  value === "non_negative_observed" ||
  value === "observed" ||
  value === "observed_symmetric" ||
  value === "fixed";

const isSourceKind = (value: unknown): value is SourceKind =>
  value === "population" || value === "subject" || value === "comparison";

const readRecord = (
  catalogFiles: Record<string, unknown>,
  id: string,
  errors: NetworkImportIssue[],
) => {
  const payload = catalogFiles[id];
  if (payload === undefined) return null;
  return parseCatalogsImportRecord(payload, `catalogs/${id}.json`, errors);
};

const readExpectedRange = (entry: Record<string, unknown> | null) => {
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

const readLabel = (entry: Record<string, unknown> | null, id: string) =>
  typeof entry?.label === "string" && entry.label.trim()
    ? entry.label.trim()
    : toLabel(id);

const readDescription = (entry: Record<string, unknown> | null) =>
  typeof entry?.description === "string" ? entry.description : null;

const readOrder = (entry: Record<string, unknown> | null) =>
  typeof entry?.order === "number" && Number.isFinite(entry.order)
    ? entry.order
    : undefined;

const readMetadata = (entry: Record<string, unknown> | null) =>
  isRecord(entry?.metadata) ? entry.metadata : undefined;

const readCatalogItem = (catalog: Record<string, unknown> | null, id: string): CatalogItem => {
  const entry = isRecord(catalog?.[id]) ? catalog[id] : null;
  return {
    id,
    label: readLabel(entry, id),
    description: readDescription(entry),
    enabled: entry?.enabled === false ? false : true,
    order: readOrder(entry),
    metadata: readMetadata(entry),
  };
};

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

const readCoreConfig = (
  aspectsPayload: Record<string, unknown> | null,
  id: CoreAspectId,
) => {
  const core = isRecord(aspectsPayload?.core) ? aspectsPayload.core : {};
  const entry = isRecord(core[id]) ? core[id] : null;
  return {
    id,
    label: readLabel(entry, id),
    description: readDescription(entry),
  };
};

const readAspects = (
  aspectsPayload: Record<string, unknown> | null,
  errors: NetworkImportIssue[],
): AspectDefinition[] => {
  if (!aspectsPayload) {
    errors.push({
      source: "catalogs/dimensions.json",
      path: "catalogs/dimensions.json",
      message: "catalogs/dimensions.json is required.",
    });
    return [];
  }
  if (!Array.isArray(aspectsPayload.aspects)) {
    errors.push({
      source: "catalogs/dimensions.json",
      path: "catalogs/dimensions.json.aspects",
      message: "aspects must be an array.",
    });
    return [];
  }

  return aspectsPayload.aspects.flatMap((item, index) => {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id.trim()) {
      errors.push({
        source: "catalogs/dimensions.json",
        path: `catalogs/dimensions.json.aspects[${index}]`,
        message: "Each aspect must define an id.",
      });
      return [];
    }
    const id = item.id.trim();
    return [{
      id,
      label: readLabel(item, id),
      description: readDescription(item),
      metadata: readMetadata(item),
    }];
  });
};

const readSource = (catalog: Record<string, unknown> | null, id: string): SourceDraft => {
  const item = readCatalogItem(catalog, id);
  const entry = isRecord(catalog?.[id]) ? catalog[id] : null;
  return {
    ...item,
    kind: isSourceKind(entry?.kind) ? entry.kind : "population",
    n: typeof entry?.n === "number" && Number.isFinite(entry.n) ? entry.n : undefined,
    left: typeof entry?.left === "string" ? entry.left : undefined,
    right: typeof entry?.right === "string" ? entry.right : undefined,
  };
};

const readMeasure = (catalog: Record<string, unknown> | null, id: string) => {
  const item = readCatalogItem(catalog, id);
  const entry = isRecord(catalog?.[id]) ? catalog[id] : null;
  const expectedRange = readExpectedRange(entry);
  return {
    ...item,
    expectedRange,
    min: expectedRange?.[0],
    max: expectedRange?.[1],
  };
};

const readStatistic = (catalog: Record<string, unknown> | null, id: string) => {
  const item = readCatalogItem(catalog, id);
  const entry = isRecord(catalog?.[id]) ? catalog[id] : null;
  const defaults = getDefaultStatConfig(id);
  const expectedRange = readExpectedRange(entry);
  return {
    ...item,
    category: typeof entry?.category === "string" ? entry.category : defaults.category,
    scaleType: isScaleType(entry?.scaleType) ? entry.scaleType : defaults.scaleType,
    center:
      typeof entry?.center === "number" || entry?.center === null
        ? entry.center
        : defaults.center,
    rangeMode: isRangeMode(entry?.rangeMode) ? entry.rangeMode : defaults.rangeMode,
    expectedRange,
    min: expectedRange?.[0],
    max: expectedRange?.[1],
    useDataRange: entry?.useDataRange === true,
  };
};

const validateNetworkDimensions = (
  networks: ImportedNetworkDraft[],
  aspects: AspectDefinition[],
  errors: NetworkImportIssue[],
) => {
  const aspectIds = new Set(aspects.map((aspect) => aspect.id));
  networks.forEach((network) => {
    aspects.forEach((aspect) => {
      if (!network.dimensions[aspect.id]) {
        errors.push({
          source: network.source,
          path: `${network.source}.dimensions.${aspect.id}`,
          message: `Matrix must define dimensions.${aspect.id}.`,
        });
      }
    });
    Object.keys(network.dimensions).forEach((id) => {
      if (!aspectIds.has(id)) {
        errors.push({
          source: network.source,
          path: `${network.source}.dimensions.${id}`,
          message: `Dimension '${id}' is not declared in catalogs/dimensions.json.`,
        });
      }
    });
  });
};

export const normalizeCatalogs = (
  catalogsPayload: unknown,
  catalogFiles: Record<string, unknown>,
  networks: ImportedNetworkDraft[],
  errors: NetworkImportIssue[],
): CatalogsDraft => {
  if (catalogsPayload !== null) {
    errors.push({
      source: "catalogs.json",
      path: "catalogs.json",
      message: "Use catalogs/*.json files; catalogs.json is not part of the dataset format.",
    });
  }

  const aspectsPayload = readRecord(catalogFiles, "dimensions", errors);
  const aspects = readAspects(aspectsPayload, errors);
  validateNetworkDimensions(networks, aspects, errors);

  const sourcesCatalog = readRecord(catalogFiles, "sources", errors);
  const measuresCatalog = readRecord(catalogFiles, "measures", errors);
  const statisticsCatalog = readRecord(catalogFiles, "statistics", errors);
  const sourceIds = new Set(networks.map((network) => network.sourceId));
  const measureIds = new Set(networks.map((network) => network.measureId));
  const statisticIds = new Set(networks.map((network) => network.statisticId));
  const aspectCatalogs: Record<string, Record<string, CatalogItemDraft>> = {};

  aspects.forEach((aspect) => {
    const catalog = readRecord(catalogFiles, aspect.id, errors);
    const ids = new Set(
      networks
        .map((network) => network.dimensions[aspect.id])
        .filter((id): id is string => Boolean(id)),
    );
    aspectCatalogs[aspect.id] = Object.fromEntries(
      [...ids].map((id) => [id, readCatalogItem(catalog, id)]),
    );
  });

  return {
    core: Object.fromEntries(
      CORE_IDS.map((id) => [id, readCoreConfig(aspectsPayload, id)]),
    ) as CatalogsDraft["core"],
    aspects,
    sources: Object.fromEntries(
      [...sourceIds].map((id) => [id, readSource(sourcesCatalog, id)]),
    ),
    measures: Object.fromEntries(
      [...measureIds].map((id) => [id, readMeasure(measuresCatalog, id)]),
    ),
    statistics: Object.fromEntries(
      [...statisticIds].map((id) => [id, readStatistic(statisticsCatalog, id)]),
    ),
    aspectCatalogs,
  };
};
