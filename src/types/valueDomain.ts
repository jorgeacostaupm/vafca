import type { ScaleType, UiRangeMode } from "@/types/connectivityBundle";

export type ValueDomainSource = "view_observed" | "catalog" | "fallback";

export type ResolvedValueDomain = {
  min: number;
  max: number;
  center: number | null;
  scaleType: ScaleType;
  mode: UiRangeMode;
  source: ValueDomainSource;
  symmetric: boolean;
};
