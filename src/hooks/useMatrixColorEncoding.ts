import { useMemo } from "react";

import {
  createMatrixColorResolver,
  getMatrixVisualStyle,
} from "@/config/matrixColorScales";
import { useAppSelector } from "@/store/hooks";
import { selectAppliedMatrixColorSettings } from "@/store/slices/visualizationUi";
import type { ResolvedValueDomain } from "@/types/valueDomain";

const FALLBACK_DOMAIN: ResolvedValueDomain = {
  min: 0,
  max: 1,
  center: null,
  scaleType: "sequential",
  mode: "view_observed",
  source: "fallback",
  symmetric: false,
};

export const useMatrixColorEncoding = (valueDomain?: ResolvedValueDomain) => {
  const matrixColorSettings = useAppSelector(selectAppliedMatrixColorSettings);
  const domain = valueDomain ?? FALLBACK_DOMAIN;
  const scaleSettings = matrixColorSettings[domain.scaleType];
  const visualStyle = useMemo(
    () => getMatrixVisualStyle(scaleSettings),
    [scaleSettings],
  );
  const colorResolver = useMemo(
    () =>
      createMatrixColorResolver({
        type: domain.scaleType,
        domain: {
          min: domain.min,
          max: domain.max,
          center: domain.center,
        },
        settings: scaleSettings,
      }),
    [domain.center, domain.max, domain.min, domain.scaleType, scaleSettings],
  );

  return {
    scaleType: domain.scaleType,
    scaleSettings,
    visualStyle,
    colorResolver,
  };
};
