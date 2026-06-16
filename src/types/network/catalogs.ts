import type {
  NetworkValueDomain,
  RangeMode,
  ScaleType,
  ValueRange,
} from "./networkData";

export type Layer = {
  id: string;
  label: string;
  description?: string | null;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
};

export type Measure = {
  id: string;
  label: string;
  description?: string | null;
  expectedRange?: ValueRange | null;
  min?: number;
  max?: number;
  valueDomain?: NetworkValueDomain;
  symmetric?: boolean;
  directed?: boolean;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
};

export type Statistic = {
  id: string;
  label: string;
  category?: string;
  description?: string | null;
  scaleType: ScaleType;
  center: number | null;
  rangeMode: RangeMode;
  expectedRange?: ValueRange | null;
  min?: number;
  max?: number;
  enabled?: boolean;
  useDataRange?: boolean;
  metadata?: Record<string, unknown>;
};

export type Population = {
  id: string;
  label: string;
  description?: string | null;
  n?: number;
  enabled?: boolean;
  metadata: Record<string, unknown>;
};

export type Subject = {
  id: string;
  label: string;
  enabled?: boolean;
  metadata: Record<string, unknown>;
};

export type Catalogs = {
  layers: Record<string, Layer>;
  measures: Record<string, Measure>;
  statistics: Record<string, Statistic>;
  populations: Record<string, Population>;
  subjects: Record<string, Subject>;
};
