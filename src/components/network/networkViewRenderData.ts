import type { MatrixValueRange } from "@/types/matrixView";
import type {
  CanonicalMatrixData,
  MatrixViewRenderData,
  NetworkViewType,
  NodeLinkViewRenderData,
} from "@/types/networkVisualization";
import { filterIsolatedMatrixEntries,filterMatrixByLabels } from "@/utils/matrixFiltering";

export const buildCanonicalMatrixData = ({
  matrixData,
  labels,
  rowLabelSelection,
  colLabelSelection,
  hideIsolatedNodes,
  valueFilters,
}: {
  matrixData: number[][];
  labels?: string[];
  rowLabelSelection?: string[];
  colLabelSelection?: string[];
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

export const toMatrixViewRenderData = (
  canonical: CanonicalMatrixData,
): MatrixViewRenderData => canonical;

export const toNodeLinkViewRenderData = (
  canonical: CanonicalMatrixData,
): NodeLinkViewRenderData => ({
  data: canonical.data,
  labels: canonical.rowLabels,
});

export const toRenderDataByViewType = (
  viewType: NetworkViewType,
  canonical: CanonicalMatrixData,
) => {
  if (viewType === "matrix") {
    return {
      type: "matrix" as const,
      payload: toMatrixViewRenderData(canonical),
    };
  }
  return {
    type: "node-link" as const,
    payload: toNodeLinkViewRenderData(canonical),
  };
};
