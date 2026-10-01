import { dimensionKey, dimensionLabel } from "@/networkDerivation/calculations/dimensions";
import type {
  NetworkCalculationOperation,
  NetworkCalculationOutputSpec,
} from "@/networkDerivation/calculations/types";
import type {
  Catalogs,
  MatrixCellValue,
  Network,
  NetworkComparisonDerivation,
  NetworkValueDomain,
} from "@/types/network";
import { computeNetworkMatrixDataStats } from "@/utils/networkDataStats";

type DerivedNetworkParams = {
  id: string;
  label: string;
  sourceId: string;
  dimensions: Record<string, string>;
  measureId: string;
  nodeSetId: string;
  nodeIds: string[];
  statisticId: string;
  derivation: NetworkComparisonDerivation;
  valueDomain: NetworkValueDomain;
  dependencies: string[];
  provenanceParameters: Record<string, unknown>;
  data: MatrixCellValue[][];
};

export const populationLabel = (catalogs: Catalogs, populationId?: string) =>
  populationId ? catalogs.sources[populationId]?.label ?? populationId : "Unknown";

export const subjectLabel = (catalogs: Catalogs, subjectId?: string) =>
  subjectId ? catalogs.sources[subjectId]?.label ?? subjectId : "Unknown";

export const measureLabel = (catalogs: Catalogs, measureId: string) =>
  catalogs.measures[measureId]?.label ?? measureId;

export const generateDerivedNetworkId = (params: {
  prefix?: string;
  leftId?: string;
  rightId?: string;
  subjectId?: string;
  dimensions: Record<string, string>;
  rightDimensions?: Record<string, string>;
  measureId: string;
  operator: string;
  existingIds: Set<string>;
}) => {
  const base =
    params.prefix ??
    [
      "cmp",
      params.subjectId ?? params.leftId,
      params.rightId ? "vs" : null,
      params.rightId,
      dimensionKey(params.dimensions),
      params.rightDimensions ? dimensionKey(params.rightDimensions) : null,
      params.measureId,
      params.operator,
    ]
      .filter(Boolean)
      .join("_")
      .replaceAll(/[^A-Za-z0-9_-]/g, "_");

  if (!params.existingIds.has(base)) return base;
  let index = 2;
  while (params.existingIds.has(`${base}__runtime_${index}`)) index += 1;
  return `${base}__runtime_${index}`;
};

export const generateDerivedNetworkLabel = (params: {
  catalogs: Catalogs;
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  subjectId?: string;
  rightSubjectId?: string;
  dimensions: Record<string, string>;
  rightDimensions?: Record<string, string>;
  measureId: string;
  suffix: string;
  useMinus?: boolean;
}) => {
  const left = params.subjectId
    ? subjectLabel(params.catalogs, params.subjectId)
    : populationLabel(params.catalogs, params.leftPopulationId);
  const right = populationLabel(
    params.catalogs,
    params.referencePopulationId ?? params.rightPopulationId,
  );
  const rightLabel = params.rightSubjectId
    ? subjectLabel(params.catalogs, params.rightSubjectId)
    : right;
  const separator = params.useMinus ? " - " : " vs ";
  return `${left}${separator}${rightLabel} · ${dimensionLabel(params.catalogs, params.dimensions)}${params.rightDimensions ? ` → ${dimensionLabel(params.catalogs, params.rightDimensions)}` : ""} · ${measureLabel(params.catalogs, params.measureId)} · ${params.suffix}`;
};

export const outputValueDomain = (output: NetworkCalculationOutputSpec): NetworkValueDomain => {
  if (output.statisticId === "p_value") {
    return { min: 0, max: 1, center: null, units: output.units };
  }
  if (output.rangeMode === "non_negative_observed") {
    return { min: 0, max: null, center: null, units: output.units };
  }
  if (output.statisticId === "difference") {
    return { min: null, max: null, center: 0, units: output.units };
  }
  return { min: null, max: null, center: output.center, units: output.units };
};

export const createDerivedNetwork = ({
  id,
  label,
  sourceId,
  dimensions,
  measureId,
  nodeSetId,
  nodeIds,
  statisticId,
  derivation,
  valueDomain,
  dependencies,
  provenanceParameters,
  data,
}: DerivedNetworkParams): Network => {
  return {
    id,
    label,
    sourceId,
    dimensions: { ...dimensions },
    measureId,
    statisticId,
    nodeSetId,
    nodeIds,
    data: {
      format: "matrix",
      layout: "full",
      dtype: "float64",
      values: data,
      missingValue: null,
    },
    valueDomain,
    dataStats: computeNetworkMatrixDataStats(data),
    provenance: {
      generatedBy: "app-runtime-calculation",
      createdAt: new Date().toISOString(),
      software: "connectivity-viewer",
      version: null,
      dependencies,
      parameters: provenanceParameters,
    },
    derivation,
  };
};

export const buildProvenanceParameters = (params: {
  operation: NetworkCalculationOperation;
  dimensions: Record<string, string>;
  rightDimensions?: Record<string, string>;
  measureId: string;
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  subjectId?: string;
  rightSubjectId?: string;
  formula: string;
  methodId: NetworkCalculationOperation;
  extra?: Record<string, unknown>;
}) => ({
  operation: params.operation,
  dimensions: params.dimensions,
  rightDimensions: params.rightDimensions,
  measureId: params.measureId,
  leftPopulationId: params.leftPopulationId,
  rightPopulationId: params.rightPopulationId,
  referencePopulationId: params.referencePopulationId,
  subjectId: params.subjectId,
  rightSubjectId: params.rightSubjectId,
  directionLabel:
    params.leftPopulationId && (params.rightPopulationId ?? params.referencePopulationId)
      ? `${params.leftPopulationId} - ${params.rightPopulationId ?? params.referencePopulationId}`
      : undefined,
  formula: params.formula,
  methodId: params.methodId,
  ...params.extra,
});
