import type {
  Atlas,
  MatrixCellValue,
  MatrixData,
  MatrixRecord,
  RoiGroup,
} from "@/types/connectivityBundle";
import { getMatrixValue } from "@/utils/connectivityMatrix";
import { computeMatrixDataStats } from "@/utils/matrixDataStats";
import { buildCircularCategoryOrderKey } from "@/utils/circular/hierarchy";
import { getMatrixPopulationIds } from "@/utils/matrixSource";

export type RoiGroupingConfig = {
  source: "visualizationSettings" | "manual";
  fields: string[];
  categoryOrder: Record<string, string[]>;
  paletteId?: string | null;
  missingTagPolicy: "unknown_group" | "exclude" | "error";
};

export type AggregatedMatrixOrderMode = "matrix" | "circular";

export type BuildRoiGroupsResult = {
  groups: RoiGroup[];
  excludedRoiIds: string[];
  missingTagRoiIds: string[];
};

export type ComputeAggregatedMatrixResult = {
  data: MatrixCellValue[][];
  cellCounts: number[][];
};

export type CreateReducedMatrixRecordArgs = {
  baseMatrix: MatrixRecord;
  atlas: Atlas;
  groups: RoiGroup[];
  data: MatrixData;
  cellCounts: number[][];
  fields: string[];
  excludedRoiIds: string[];
  activeRoiIds: string[];
  activeRoiSetHash: string;
  groupOrderHash: string;
  orderMode: AggregatedMatrixOrderMode;
  missingTagPolicy: RoiGroupingConfig["missingTagPolicy"];
};

const UNKNOWN_VALUE = "Unknown";

const tagToString = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const groupIdFromCriteria = (fields: string[], criteria: Record<string, string>) =>
  fields.map((field) => `${field}=${criteria[field]}`).join("|");

const groupLabelFromCriteria = (fields: string[], criteria: Record<string, string>) =>
  fields.map((field) => criteria[field]).join(" / ");

export const getCurrentVisualizationGrouping = (
  fields: string[],
  categoryOrder: Record<string, string[]> = {},
): RoiGroupingConfig | null => {
  const normalized = fields.map((field) => field.trim()).filter(Boolean);
  if (normalized.length === 0) return null;
  return {
    source: "visualizationSettings",
    fields: Array.from(new Set(normalized)),
    categoryOrder,
    paletteId: "current",
    missingTagPolicy: "unknown_group",
  };
};

export const hashRoiSet = (roiIds: string[]) => {
  const source = [...roiIds].sort().join("|");
  return hashString(source);
};

export const hashGroupOrder = (groupIds: string[]) => hashString(groupIds.join("|"));

const hashString = (source: string) => {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
};

export const buildRoiGroupsFromTags = ({
  atlas,
  fields,
  categoryOrder = {},
  activeRoiIds,
  missingTagPolicy,
}: {
  atlas: Atlas;
  fields: string[];
  categoryOrder?: Record<string, string[]>;
  activeRoiIds: Set<string>;
  missingTagPolicy: RoiGroupingConfig["missingTagPolicy"];
}): BuildRoiGroupsResult => {
  const groups = new Map<string, RoiGroup>();
  const excludedRoiIds: string[] = [];
  const missingTagRoiIds: string[] = [];

  atlas.rois.forEach((roi) => {
    const roiId = String(roi.id);
    if (!activeRoiIds.has(roiId)) {
      excludedRoiIds.push(roiId);
      return;
    }

    const criteria: Record<string, string> = {};
    const missing = fields.filter((field) => tagToString(roi.tags?.[field]) === null);
    if (missing.length > 0) {
      missingTagRoiIds.push(roiId);
      if (missingTagPolicy === "exclude") {
        excludedRoiIds.push(roiId);
        return;
      }
      if (missingTagPolicy === "error") {
        return;
      }
    }

    fields.forEach((field) => {
      criteria[field] = tagToString(roi.tags?.[field]) ?? UNKNOWN_VALUE;
    });

    const id = groupIdFromCriteria(fields, criteria);
    const existing = groups.get(id);
    if (existing) {
      existing.roiIds.push(roiId);
      return;
    }
    groups.set(id, {
      id,
      label: groupLabelFromCriteria(fields, criteria),
      criteria,
      roiIds: [roiId],
    });
  });

  const compareGroups = (a: RoiGroup, b: RoiGroup) => {
    const parentValues: string[] = [];

    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      const orderKey = buildCircularCategoryOrderKey(index, parentValues);
      const configuredOrder = categoryOrder[orderKey] ?? [];
      const aValue = a.criteria[field] ?? UNKNOWN_VALUE;
      const bValue = b.criteria[field] ?? UNKNOWN_VALUE;
      const aIndex = configuredOrder.indexOf(aValue);
      const bIndex = configuredOrder.indexOf(bValue);

      if (aIndex !== bIndex) {
        if (aIndex < 0) return 1;
        if (bIndex < 0) return -1;
        return aIndex - bIndex;
      }

      const fallback = aValue.localeCompare(bValue, undefined, {
        sensitivity: "base",
      });
      if (fallback !== 0) return fallback;
      parentValues.push(aValue);
    }

    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  };

  return {
    groups: Array.from(groups.values()).sort(compareGroups),
    excludedRoiIds,
    missingTagRoiIds,
  };
};

const isValidValue = (value: MatrixCellValue): value is number =>
  typeof value === "number" && Number.isFinite(value);

const meanOrNull = (values: number[]) => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const computeAggregatedMatrix = ({
  baseMatrix,
  atlas,
  groups,
}: {
  baseMatrix: MatrixRecord;
  atlas: Atlas;
  groups: RoiGroup[];
}): ComputeAggregatedMatrixResult => {
  const indexByRoiId = new Map(
    [...atlas.rois]
      .sort((a, b) => a.index - b.index)
      .map((roi, index) => [String(roi.id), index] as const),
  );
  const directed = !baseMatrix.encoding.symmetric;

  const data = groups.map((sourceGroup, sourceIndex) =>
    groups.map((targetGroup, targetIndex) => {
      const values: number[] = [];
      const sourceIndices = sourceGroup.roiIds
        .map((id) => indexByRoiId.get(id))
        .filter((index): index is number => index !== undefined);
      const targetIndices = targetGroup.roiIds
        .map((id) => indexByRoiId.get(id))
        .filter((index): index is number => index !== undefined);

      sourceIndices.forEach((i, localSourceIndex) => {
        targetIndices.forEach((j, localTargetIndex) => {
          if (sourceIndex === targetIndex) {
            if (i === j) return;
            if (!directed && localTargetIndex <= localSourceIndex) return;
          }
          const value = getMatrixValue(baseMatrix, i, j);
          if (isValidValue(value)) values.push(value);
        });
      });

      return meanOrNull(values);
    }),
  );

  const cellCounts = groups.map((sourceGroup, sourceIndex) =>
    groups.map((targetGroup, targetIndex) => {
      const sourceSize = sourceGroup.roiIds.length;
      const targetSize = targetGroup.roiIds.length;
      if (sourceIndex !== targetIndex) return sourceSize * targetSize;
      return directed ? sourceSize * Math.max(sourceSize - 1, 0) : (sourceSize * Math.max(sourceSize - 1, 0)) / 2;
    }),
  );

  if (!directed) {
    for (let row = 0; row < data.length; row += 1) {
      for (let col = row + 1; col < data.length; col += 1) {
        data[col][row] = data[row][col];
        cellCounts[col][row] = cellCounts[row][col];
      }
    }
  }

  return { data, cellCounts };
};

export const buildReducedMatrixId = (
  baseMatrixId: string,
  fields: string[],
  aggregator = "mean",
  groupOrderHash?: string,
) =>
  [
    `red__${baseMatrixId}__by__${fields.join("_")}__${aggregator}`,
    groupOrderHash ? `order__${groupOrderHash}` : null,
  ]
    .filter(Boolean)
    .join("__");

const normalizeIdPart = (value: string) =>
  value.trim().replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") ||
  "none";

export const buildReducedLayerId = (
  baseLayerId: string | null,
  fields: string[],
  groupOrderHash?: string,
) =>
  [
    `red_layer__${normalizeIdPart(baseLayerId ?? "none")}__by__${fields
      .map(normalizeIdPart)
      .join("_")}`,
    groupOrderHash ? `order__${groupOrderHash}` : null,
  ]
    .filter(Boolean)
    .join("__");

export const createReducedMatrixRecord = ({
  baseMatrix,
  atlas,
  groups,
  data,
  cellCounts,
  fields,
  excludedRoiIds,
  activeRoiIds,
  activeRoiSetHash,
  groupOrderHash,
  orderMode,
  missingTagPolicy,
}: CreateReducedMatrixRecordArgs): MatrixRecord => {
  const id = buildReducedMatrixId(baseMatrix.id, fields, "mean", groupOrderHash);
  const label = `${baseMatrix.label ?? baseMatrix.id} by ${fields.join(" / ")}`;
  const baseLayerId = baseMatrix.context.layerId ?? null;
  const reducedLayerId = buildReducedLayerId(baseLayerId, fields, groupOrderHash);
  const valueStats = computeMatrixDataStats({
    ...baseMatrix,
    data,
    geometry: { ...baseMatrix.geometry, shape: [groups.length, groups.length] },
    encoding: { ...baseMatrix.encoding, layout: "full", missingValue: null },
  });

  return {
    ...baseMatrix,
    id,
    kind: "reduced",
    label,
    context: {
      ...baseMatrix.context,
      layerId: reducedLayerId,
    },
    source: {
      level: "reduction",
      baseMatrixId: baseMatrix.id,
      populationIds: getMatrixPopulationIds(baseMatrix),
    },
    stat: {
      id: "mean",
      method: "roi_group_aggregation",
      parameters: { aggregator: "mean" },
    },
    reduction: {
      baseMatrixId: baseMatrix.id,
      source: "visualizationSettings",
      fields,
      aggregator: "mean",
      formula: "mean of all valid ROI-to-ROI edges connecting active ROI groups",
      parameters: {
        baseMatrixId: baseMatrix.id,
        fields,
        aggregator: "mean",
        ignoreMissing: true,
        includeInactiveRois: false,
        missingTagPolicy,
        groupOrderHash,
        orderMode,
        withinGroupMode: "upperTriangleNoDiagonal",
        betweenGroupMode: "allPairs",
        activeRoiSetHash,
      },
      groups,
      cellCounts,
      excludedRoiIds,
      activeRoiSetHash,
    },
    geometry: {
      atlasId: atlas.id,
      shape: [groups.length, groups.length],
      roiOrderRef: null,
      roiOrder: groups.map((group) => group.id),
    },
    encoding: {
      layout: "full",
      dtype: baseMatrix.encoding.dtype,
      symmetric: baseMatrix.encoding.symmetric,
      missingValue: null,
    },
    dataStats: valueStats,
    provenance: {
      generatedBy: "frontend",
      createdAt: new Date().toISOString(),
      software: "connectivity-viewer",
      version: null,
      dependencies: [baseMatrix.id],
      parameters: {
        operator: "roi_group_reduce",
        fields,
        aggregator: "mean",
        source: "visualizationSettings",
        baseLayerId,
        activeRoiIds,
        groupOrderHash,
        orderMode,
      },
    },
    comparison: undefined,
    data,
  };
};

export const findEquivalentReducedMatrix = (
  matrices: MatrixRecord[],
  request: {
    baseMatrixId: string;
    fields: string[];
    activeRoiSetHash: string;
    groupOrderHash: string;
    missingTagPolicy: RoiGroupingConfig["missingTagPolicy"];
    atlasId: string;
  },
) =>
  matrices.find(
    (matrix) =>
      matrix.kind === "reduced" &&
      matrix.geometry.atlasId === request.atlasId &&
      matrix.reduction?.baseMatrixId === request.baseMatrixId &&
      matrix.reduction.aggregator === "mean" &&
      matrix.reduction.parameters.missingTagPolicy === request.missingTagPolicy &&
      matrix.reduction.activeRoiSetHash === request.activeRoiSetHash &&
      matrix.reduction.parameters.groupOrderHash === request.groupOrderHash &&
      matrix.reduction.fields.length === request.fields.length &&
      matrix.reduction.fields.every((field, index) => field === request.fields[index]),
  ) ?? null;
