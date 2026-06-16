import type {
  MatrixCellValue,
  Network,
  NetworkDataStats,
  NetworkDataStatsBucket,
} from "@/types/network";
import { getNetworkValue } from "@/utils/networkData";

const emptyBucket = (): NetworkDataStatsBucket => ({
  min: null,
  max: null,
  absMax: null,
  finiteCount: 0,
  nullCount: 0,
});

const addValue = (
  bucket: NetworkDataStatsBucket,
  value: number | null,
) => {
  if (value === null || !Number.isFinite(value)) {
    bucket.nullCount += 1;
    return;
  }

  bucket.min = bucket.min === null ? value : Math.min(bucket.min, value);
  bucket.max = bucket.max === null ? value : Math.max(bucket.max, value);
  bucket.absMax =
    bucket.absMax === null
      ? Math.abs(value)
      : Math.max(bucket.absMax, Math.abs(value));
  bucket.finiteCount += 1;
};

export const computeNetworkMatrixDataStats = (
  values: MatrixCellValue[][],
): NetworkDataStats => {
  const allValues = emptyBucket();

  values.forEach((row) => {
    row.forEach((value) => {
      addValue(
        allValues,
        typeof value === "number" && Number.isFinite(value) ? value : null,
      );
    });
  });

  return { allValues };
};

export const computeNetworkDataStats = (
  network: Network,
): NetworkDataStats => {
  const allValues = emptyBucket();

  network.nodeIds.forEach((sourceNodeId) => {
    network.nodeIds.forEach((targetNodeId) => {
      addValue(allValues, getNetworkValue(network, sourceNodeId, targetNodeId));
    });
  });

  return { allValues };
};
