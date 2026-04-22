export type ConnectivityMatrix = {
  id: string;
  bandId: string;
  measureId: string;
  statId: string;
  populationIds: string[];
  data: number[][];
};
