import { filterMatrixByLabels, filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";
import type { MatrixShape } from "@/utils/matrixValue";
import type { MatrixValueRange } from "@/utils/matrixFiltering";
import type { NetworkViewType } from "@/types/networkVisualization";

export type CanonicalMatrixData = {
  data: number[][];
  rowLabels: string[];
  colLabels: string[];
};

export type AdaptedMatrixViewData = CanonicalMatrixData;

export type AdaptedNodeLinkViewData = {
  data: number[][];
  labels: string[];
};

export const buildCanonicalMatrixData = ({
  matrixData,
  labels,
  rowLabelSelection,
  colLabelSelection,
  matrixShape,
  hideIsolatedNodes,
  valueFilters,
}: {
  matrixData: number[][];
  labels?: string[];
  rowLabelSelection?: string[];
  colLabelSelection?: string[];
  matrixShape: MatrixShape;
  hideIsolatedNodes: boolean;
  valueFilters?: {
    measure?: [number, number] | null;
    stat?: MatrixValueRange;
  };
}): CanonicalMatrixData => {
  const {
    data: filteredData,
    rowLabels: filteredRowLabels,
    colLabels: filteredColLabels,
  } = filterMatrixByLabels(
    matrixData,
    labels,
    rowLabelSelection,
    colLabelSelection,
    matrixShape,
  );

  if (!hideIsolatedNodes) {
    return {
      data: filteredData,
      rowLabels: filteredRowLabels ?? [],
      colLabels: filteredColLabels ?? [],
    };
  }

  const isolatedFiltered = filterIsolatedMatrixEntries(
    filteredData,
    filteredRowLabels ?? [],
    filteredColLabels ?? [],
    valueFilters,
  );
  return {
    data: isolatedFiltered.data,
    rowLabels: isolatedFiltered.rowLabels ?? [],
    colLabels: isolatedFiltered.colLabels ?? [],
  };
};

export const adaptMatrixViewData = (
  canonical: CanonicalMatrixData,
): AdaptedMatrixViewData => canonical;

export const adaptNodeLinkViewData = (
  canonical: CanonicalMatrixData,
): AdaptedNodeLinkViewData => ({
  data: canonical.data,
  labels: canonical.rowLabels,
});

export const adaptDataByViewType = (
  viewType: NetworkViewType,
  canonical: CanonicalMatrixData,
) => {
  if (viewType === "matrix") {
    return {
      type: "matrix" as const,
      payload: adaptMatrixViewData(canonical),
    };
  }
  return {
    type: "node-link" as const,
    payload: adaptNodeLinkViewData(canonical),
  };
};
