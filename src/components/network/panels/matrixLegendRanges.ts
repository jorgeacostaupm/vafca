import { resolveMatrixUiRange, type ResolvedUiRange } from "@/utils/matrixUiRange";
import type { ComputedView, NetworkViewDescriptor } from "@/types/networkVisualization";
import type { RootState } from "@/types/store";

type MatrixRecord = Exclude<
  Awaited<ReturnType<typeof import("@/utils/matrixStore").getMatrix>>,
  undefined
>;

type BuildComparableMatrixLegendRangesArgs = {
  views: NetworkViewDescriptor[];
  matrixByCompoundId: Record<string, MatrixRecord | null | undefined>;
  computedByViewId: Record<string, ComputedView>;
  dataset: RootState["dataset"]["data"];
};

type LegendRangeGroup = {
  keyRange: ResolvedUiRange;
  viewIds: string[];
};

const getComparableLegendGroupKey = (view: NetworkViewDescriptor) =>
  `${view.measureId}\u0000${view.statId}`;

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

export const buildComparableMatrixLegendRanges = ({
  views,
  matrixByCompoundId,
  computedByViewId,
  dataset,
}: BuildComparableMatrixLegendRangesArgs): Record<string, ResolvedUiRange> => {
  const groups = new Map<string, LegendRangeGroup>();

  views.forEach((view) => {
    if (view.type !== "matrix") return;

    const matrixRecord = matrixByCompoundId[view.compoundId];
    const computed = computedByViewId[view.id];
    if (!matrixRecord || !computed) return;

    const sourceMatrix =
      dataset?.connectivity?.matrixIndex[matrixRecord.id] ?? matrixRecord;
    const range = resolveMatrixUiRange(sourceMatrix, dataset?.catalogs, {
      uiRangeMode: computed.uiRangeMode,
      target: "colorLegend",
    });
    const key = getComparableLegendGroupKey(view);
    const existing = groups.get(key);

    if (!existing) {
      groups.set(key, { keyRange: range, viewIds: [view.id] });
      return;
    }

    existing.keyRange = mergeLegendRange(existing.keyRange, range);
    existing.viewIds.push(view.id);
  });

  const rangesByViewId: Record<string, ResolvedUiRange> = {};
  groups.forEach(({ keyRange, viewIds }) => {
    viewIds.forEach((viewId) => {
      rangesByViewId[viewId] = keyRange;
    });
  });

  return rangesByViewId;
};
