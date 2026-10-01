import type { ScaleType, UiRangeMode } from "@/types/network";

export type ValueDomainSource = "view_observed" | "shared" | "fallback";

export type ResolvedValueDomain = {
  min: number;
  max: number;
  center: number | null;
  scaleType: ScaleType;
  mode: UiRangeMode;
  source: ValueDomainSource;
  symmetric: boolean;
};
