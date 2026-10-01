import type {
  NetworkValueDomain,
  RangeMode,
  ScaleType,
  ValueRange,
} from "./networkData";

export type CoreAspectId = "source" | "measure" | "statistic";

export type CoreAspectConfig = {
  id: CoreAspectId;
  label: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

export type AspectDefinition = {
  id: string;
  label: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

export type CatalogItem = {
  id: string;
  label: string;
  description?: string | null;
  enabled?: boolean;
  order?: number;
  metadata?: Record<string, unknown>;
};

export type SourceKind = "population" | "subject" | "comparison";

export type Source = CatalogItem & {
  kind: SourceKind;
  n?: number;
  left?: string;
  right?: string;
};

export type Measure = CatalogItem & {
  expectedRange?: ValueRange | null;
  min?: number;
  max?: number;
  valueDomain?: NetworkValueDomain;
};

export type Statistic = CatalogItem & {
  category?: string;
  scaleType: ScaleType;
  center: number | null;
  rangeMode: RangeMode;
  expectedRange?: ValueRange | null;
  min?: number;
  max?: number;
  useDataRange?: boolean;
};

export type Catalogs = {
  core: Record<CoreAspectId, CoreAspectConfig>;
  aspects: AspectDefinition[];
  sources: Record<string, Source>;
  measures: Record<string, Measure>;
  statistics: Record<string, Statistic>;
  aspectCatalogs: Record<string, Record<string, CatalogItem>>;
};
