import type {
  MatrixCalculationOperation,
  MatrixCalculationOutputSpec,
} from "@/networkDerivation/calculations/types";
import type {
  Catalogs,
  ConnectivityMatrix,
  MatrixCellValue,
  MatrixComparison,
  MatrixDataStats,
  MatrixSource,
  MatrixValueDomain,
} from "@/types/connectivityBundle";
import { computeMatrixDataStats } from "@/utils/matrixDataStats";

type DerivedMatrixParams = {
  id: string;
  label: string;
  context: ConnectivityMatrix["context"];
  geometry: ConnectivityMatrix["geometry"];
  symmetric: boolean;
  source: MatrixSource;
  stat: ConnectivityMatrix["stat"];
  comparison: MatrixComparison;
  valueDomain: MatrixValueDomain;
  dependencies: string[];
  provenanceParameters: Record<string, unknown>;
  data: MatrixCellValue[][];
};

export const populationLabel = (catalogs: Catalogs, populationId?: string) =>
  populationId ? catalogs.populations[populationId]?.label ?? populationId : "Unknown";

export const subjectLabel = (catalogs: Catalogs, subjectId?: string) =>
  subjectId ? catalogs.subjects[subjectId]?.label ?? subjectId : "Unknown";

export const layerLabel = (catalogs: Catalogs, layerId: string | null) =>
  layerId ? catalogs.layers[layerId]?.label ?? layerId : "No layer";

export const measureLabel = (catalogs: Catalogs, measureId: string) =>
  catalogs.measures[measureId]?.label ?? measureId;

export const generateDerivedMatrixId = (params: {
  prefix?: string;
  leftId?: string;
  rightId?: string;
  subjectId?: string;
  layerId: string | null;
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
      params.layerId ?? "none",
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

export const generateDerivedMatrixLabel = (params: {
  catalogs: Catalogs;
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  subjectId?: string;
  rightSubjectId?: string;
  layerId: string | null;
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
  return `${left}${separator}${rightLabel} · ${layerLabel(params.catalogs, params.layerId)} · ${measureLabel(params.catalogs, params.measureId)} · ${params.suffix}`;
};

export const outputValueDomain = (output: MatrixCalculationOutputSpec): MatrixValueDomain => {
  if (output.statId === "p_value") {
    return { min: 0, max: 1, center: null, units: output.units };
  }
  if (output.statId === "difference") {
    return { min: -1, max: 1, center: 0, units: output.units };
  }
  return { min: null, max: null, center: output.center, units: output.units };
};

export const createDerivedMatrix = ({
  id,
  label,
  context,
  geometry,
  symmetric,
  source,
  stat,
  comparison,
  valueDomain,
  dependencies,
  provenanceParameters,
  data,
}: DerivedMatrixParams): ConnectivityMatrix => {
  const draft: ConnectivityMatrix = {
    id,
    kind: "comparison",
    label,
    context: { ...context },
    source,
    stat,
    geometry: { ...geometry },
    encoding: {
      layout: "full",
      dtype: "float64",
      symmetric,
      missingValue: null,
    },
    valueDomain,
    provenance: {
      generatedBy: "app-runtime-calculation",
      createdAt: new Date().toISOString(),
      software: "connectivity-viewer",
      version: null,
      dependencies,
      parameters: provenanceParameters,
    },
    comparison,
    data,
  };
  return { ...draft, dataStats: computeMatrixDataStats(draft) as MatrixDataStats };
};

export const buildProvenanceParameters = (params: {
  operation: MatrixCalculationOperation;
  layerId: string | null;
  measureId: string;
  leftPopulationId?: string;
  rightPopulationId?: string;
  referencePopulationId?: string;
  subjectId?: string;
  rightSubjectId?: string;
  formula: string;
  methodId: MatrixCalculationOperation;
  extra?: Record<string, unknown>;
}) => ({
  operation: params.operation,
  layerId: params.layerId,
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
