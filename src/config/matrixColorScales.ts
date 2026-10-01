import * as d3 from "d3";

import {
  DEFAULT_MATRIX_BACKGROUND_COLOR,
  DEFAULT_MATRIX_COLOR_DISCRETE_STEPS,
} from "@/config/ui";
import { appColors } from "@/theme";
import type { ScaleType } from "@/types/network";
import type {
  MatrixColorScaleSettings,
  MatrixColorSettings,
  MatrixVisualStyle,
} from "@/types/visualizationUi";

export const DEFAULT_CIRCULAR_POSITIVE_LINK_COLOR = "#2563eb";
export const DEFAULT_CIRCULAR_NEGATIVE_LINK_COLOR = "#dc2626";

export type CircularLinkColorSettings = {
  positive: string;
  negative: string;
};

export type MatrixColorInterpolator = (t: number) => string;

export type MatrixColorScaleDefinition = {
  id: string;
  label: string;
  type: ScaleType;
  interpolator: MatrixColorInterpolator;
  defaultHighlightColor: string;
  defaultSelectionColor: string;
};

export type MatrixColorDomain = {
  min: number;
  max: number;
  center: number | null;
};

export const MATRIX_COLOR_SCALE_DEFINITIONS: MatrixColorScaleDefinition[] = [
  {
    id: "ylgnbu",
    label: "Yellow Green Blue",
    type: "sequential",
    interpolator: d3.interpolateYlGnBu,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "viridis",
    label: "Viridis",
    type: "sequential",
    interpolator: d3.interpolateViridis,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "cividis",
    label: "Cividis",
    type: "sequential",
    interpolator: d3.interpolateCividis,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "turbo",
    label: "Turbo",
    type: "sequential",
    interpolator: d3.interpolateTurbo,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "magma",
    label: "Magma",
    type: "sequential",
    interpolator: d3.interpolateMagma,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "inferno",
    label: "Inferno",
    type: "sequential",
    interpolator: d3.interpolateInferno,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "rdbu",
    label: "Red Blue",
    type: "diverging",
    interpolator: d3.interpolateRdBu,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "piyg",
    label: "Pink Yellow Green",
    type: "diverging",
    interpolator: d3.interpolatePiYG,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "prgn",
    label: "Purple Green",
    type: "diverging",
    interpolator: d3.interpolatePRGn,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "puor",
    label: "Purple Orange",
    type: "diverging",
    interpolator: d3.interpolatePuOr,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "brbg",
    label: "Brown Blue Green",
    type: "diverging",
    interpolator: d3.interpolateBrBG,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
  {
    id: "spectral",
    label: "Spectral",
    type: "diverging",
    interpolator: d3.interpolateSpectral,
    defaultHighlightColor: appColors.visualHighlight,
    defaultSelectionColor: appColors.visualSelection,
  },
];

const DEFAULT_SCALE_ID_BY_TYPE: Record<ScaleType, string> = {
  sequential: "ylgnbu",
  diverging: "rdbu",
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const getDefinitionFallback = (type: ScaleType) =>
  MATRIX_COLOR_SCALE_DEFINITIONS.find(
    (definition) => definition.id === DEFAULT_SCALE_ID_BY_TYPE[type],
  ) ?? MATRIX_COLOR_SCALE_DEFINITIONS.find((definition) => definition.type === type)!;

export const getMatrixColorScaleDefinitions = (type: ScaleType) =>
  MATRIX_COLOR_SCALE_DEFINITIONS.filter((definition) => definition.type === type);

export const getMatrixColorScaleDefinition = (
  scaleId: string,
  type: ScaleType,
) =>
  MATRIX_COLOR_SCALE_DEFINITIONS.find(
    (definition) => definition.id === scaleId && definition.type === type,
  ) ?? getDefinitionFallback(type);

export const buildMatrixColorScaleSettings = (
  definition: MatrixColorScaleDefinition,
): MatrixColorScaleSettings => ({
  scaleId: definition.id,
  invert: false,
  discretize: false,
  discreteSteps: DEFAULT_MATRIX_COLOR_DISCRETE_STEPS,
  highlightColor: definition.defaultHighlightColor,
  selectionColor: definition.defaultSelectionColor,
});

export const DEFAULT_MATRIX_COLOR_SETTINGS: MatrixColorSettings = {
  sequential: buildMatrixColorScaleSettings(getDefinitionFallback("sequential")),
  diverging: buildMatrixColorScaleSettings(getDefinitionFallback("diverging")),
};

export const cloneMatrixColorSettings = (
  settings: MatrixColorSettings,
): MatrixColorSettings => ({
  sequential: { ...settings.sequential },
  diverging: { ...settings.diverging },
});

export const resetMatrixScaleInteractionColors = (
  settings: MatrixColorScaleSettings,
  type: ScaleType,
): MatrixColorScaleSettings => {
  const definition = getMatrixColorScaleDefinition(settings.scaleId, type);
  return {
    ...settings,
    highlightColor: definition.defaultHighlightColor,
    selectionColor: definition.defaultSelectionColor,
  };
};

export const getMatrixVisualStyle = (
  settings: MatrixColorScaleSettings,
  backgroundColor = DEFAULT_MATRIX_BACKGROUND_COLOR,
): MatrixVisualStyle => ({
  highlightColor: settings.highlightColor,
  selectionColor: settings.selectionColor,
  backgroundColor,
});

const getValueT = (
  value: number,
  type: ScaleType,
  domain: MatrixColorDomain,
) => {
  const center = domain.center ?? (domain.min + domain.max) / 2;
  const min = Number.isFinite(domain.min) ? domain.min : 0;
  const max = Number.isFinite(domain.max) ? domain.max : 1;

  if (type === "diverging") {
    return clamp01(
      d3
        .scaleLinear()
        .domain([min, center, max])
        .range([0, 0.5, 1])
        .clamp(true)(value),
    );
  }

  return clamp01(
    d3.scaleLinear().domain([min, max]).range([0, 1]).clamp(true)(value),
  );
};

const discretizeT = (t: number, steps: number) => {
  const safeSteps = Math.max(1, Math.round(steps));
  return clamp01((Math.floor(clamp01(t) * safeSteps) + 0.5) / safeSteps);
};

export const createMatrixColorResolver = (args: {
  type: ScaleType;
  domain: MatrixColorDomain;
  settings: MatrixColorScaleSettings;
}) => {
  const { type, domain, settings } = args;
  const definition = getMatrixColorScaleDefinition(settings.scaleId, type);

  return (value: number) => {
    const t = getValueT(value, type, domain);
    const scaleT = settings.invert ? 1 - t : t;
    const resolvedT = settings.discretize
      ? discretizeT(scaleT, settings.discreteSteps)
      : scaleT;
    return definition.interpolator(resolvedT);
  };
};

export const getMatrixScalePreviewDomain = (type: ScaleType): MatrixColorDomain =>
  type === "diverging"
    ? { min: -1, max: 1, center: 0 }
    : { min: 0, max: 1, center: null };

export const createCircularLinkColorResolver =
  ({ positive, negative }: CircularLinkColorSettings) =>
  (value: number) =>
    value < 0 ? negative : positive;
