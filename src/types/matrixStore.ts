import type { MatrixViewData } from "@/types/connectivityBundle";

export type StoredMatrix = MatrixViewData & { compoundId: string };

export type MatrixSummary = {
  compoundId: string;
  layerId: string;
  measureId: string;
  statId: string;
  populationIds: string[];
  size: number;
  symmetric: boolean;
};
