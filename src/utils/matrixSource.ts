import type { ConnectivityMatrix } from "@/types/connectivityBundle";

export const getMatrixPopulationIds = (matrix: ConnectivityMatrix): string[] => {
  if (matrix.source.level === "comparison") {
    return [
      ...(matrix.source.left.populationIds ?? []),
      ...(matrix.source.right.populationIds ?? []),
    ];
  }

  if ("populationIds" in matrix.source) {
    return matrix.source.populationIds ?? [];
  }

  return [];
};
