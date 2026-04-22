import type { ConnectivityMatrix } from "@/types/matrix";

export type StoredMatrix = ConnectivityMatrix & { compoundId: string };

export type MatrixSummary = {
  compoundId: string;
  bandId: string;
  measureId: string;
  statId: string;
  populationIds: string[];
  size: number;
};
