import { getDatasetCatalogs } from "@/utils/datasetAccessors";
import {
  resolveMatrixUiRange,
  type ResolvedUiRange,
} from "@/utils/matrixUiRange";
import type { UiRangeMode } from "@/types/connectivityBundle";
import type { DatasetMeta } from "@/types/datasetState";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";
import type { StoredMatrix } from "@/types/matrixStore";

type BuildComparableMatrixLegendRangeArgs = {
  view: NetworkViewDescriptor;
  views: NetworkViewDescriptor[];
  matrixByCompoundId: Record<string, StoredMatrix | null>;
  dataset: DatasetMeta | null;
  uiRangeMode: UiRangeMode;
};

const mergeLegendRange = (
  current: ResolvedUiRange,
  next: ResolvedUiRange,
): ResolvedUiRange => {
  const min = Math.min(current.min, next.min);
  const max = Math.max(current.max, next.max);
  const center = current.center ?? next.center;

  if (center !== null && current.scaleType === "diverging") {
    const delta = Math.max(Math.abs(min - center), Math.abs(max - center));
    return {
      ...current,
      min: center - delta,
      max: center + delta,
      center,
    };
  }

  return {
    ...current,
    min,
    max,
    center,
  };
};

export const buildComparableMatrixLegendRange = ({
  view,
  views,
  matrixByCompoundId,
  dataset,
  uiRangeMode,
}: BuildComparableMatrixLegendRangeArgs): ResolvedUiRange | undefined => {
  if (view.type !== "matrix") return undefined;

  const catalogs = getDatasetCatalogs(dataset);
  let merged: ResolvedUiRange | undefined;

  views.forEach((candidate) => {
    if (candidate.type !== "matrix") return;
    if (candidate.measureId !== view.measureId || candidate.statId !== view.statId) {
      return;
    }

    const matrix = matrixByCompoundId[candidate.compoundId];
    if (!matrix) return;
    const sourceMatrix = dataset?.content?.matrixIndex[matrix.id] ?? matrix;
    const range = resolveMatrixUiRange(sourceMatrix, catalogs, {
      uiRangeMode,
      target: "colorLegend",
    });
    merged = merged ? mergeLegendRange(merged, range) : range;
  });

  return merged;
};
