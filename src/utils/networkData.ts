import type {
  MatrixCellValue,
  MatrixNetworkData,
  Network,
  NetworkEdge,
} from "@/types/network";

const isMatrixNetworkData = (
  data: Network["data"],
): data is MatrixNetworkData => data.format === "matrix";

export const getNetworkKind = (network: Network) => network.source.type;

export const getNetworkNodeIds = (network: Network) => network.nodeIds;

export const isDirectedNetwork = (network: Network) => {
  if (isMatrixNetworkData(network.data)) return !network.data.symmetric;
  return network.data.directed;
};

const getMatrixValue = (
  data: MatrixNetworkData,
  row: number,
  col: number,
): MatrixCellValue => {
  if (data.layout === "full") {
    const rows = data.values as MatrixCellValue[][];
    return rows[row]?.[col] ?? data.missingValue;
  }

  const size = networkMatrixSize(data);
  if (data.layout === "upper_triangular") {
    if (row > col) {
      return data.symmetric ? getMatrixValue(data, col, row) : data.missingValue;
    }
    const index = row * size - (row * (row - 1)) / 2 + (col - row);
    return (data.values as MatrixCellValue[])[index] ?? data.missingValue;
  }

  if (col > row) {
    return data.symmetric ? getMatrixValue(data, col, row) : data.missingValue;
  }
  const index = (row * (row + 1)) / 2 + col;
  return (data.values as MatrixCellValue[])[index] ?? data.missingValue;
};

const triangularSizeFromLength = (length: number) => {
  const size = (Math.sqrt(8 * length + 1) - 1) / 2;
  return Number.isInteger(size) ? size : 0;
};

export const networkMatrixSize = (data: MatrixNetworkData) =>
  data.layout === "full"
    ? (data.values as MatrixCellValue[][]).length
    : triangularSizeFromLength((data.values as MatrixCellValue[]).length);

export function* iterateNetworkEdges(network: Network): Generator<NetworkEdge> {
  if (!isMatrixNetworkData(network.data)) {
    yield* network.data.edges;
    return;
  }

  const nodeIds = getNetworkNodeIds(network);
  const size = networkMatrixSize(network.data);
  const directed = isDirectedNetwork(network);

  for (let row = 0; row < size; row += 1) {
    const startCol = directed ? 0 : row;
    for (let col = startCol; col < size; col += 1) {
      const value = getMatrixValue(network.data, row, col);
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      yield {
        sourceId: nodeIds[row] ?? String(row),
        targetId: nodeIds[col] ?? String(col),
        value,
      };
    }
  }
}

export const materializeNetworkMatrix = (network: Network): number[][] => {
  const nodeIds = getNetworkNodeIds(network);
  const size = nodeIds.length;
  const matrix = Array.from({ length: size }, () => Array<number>(size).fill(NaN));

  if (isMatrixNetworkData(network.data)) {
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const value = getMatrixValue(network.data, row, col);
        matrix[row][col] = typeof value === "number" ? value : NaN;
      }
    }
    return matrix;
  }

  const indexById = new Map(nodeIds.map((id, index) => [id, index] as const));
  for (const edge of network.data.edges) {
    const sourceIndex = indexById.get(edge.sourceId);
    const targetIndex = indexById.get(edge.targetId);
    if (sourceIndex === undefined || targetIndex === undefined) continue;
    matrix[sourceIndex][targetIndex] = edge.value;
    if (!network.data.directed) matrix[targetIndex][sourceIndex] = edge.value;
  }
  return matrix;
};

export const getNetworkValue = (
  network: Network,
  sourceNodeId: string,
  targetNodeId: string,
) => {
  const nodeIds = getNetworkNodeIds(network);
  const sourceIndex = nodeIds.indexOf(sourceNodeId);
  const targetIndex = nodeIds.indexOf(targetNodeId);
  if (sourceIndex < 0 || targetIndex < 0) return null;

  if (isMatrixNetworkData(network.data)) {
    const value = getMatrixValue(network.data, sourceIndex, targetIndex);
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  const edge = network.data.edges.find(
    (item) =>
      item.sourceId === sourceNodeId &&
      item.targetId === targetNodeId,
  );
  if (edge) return edge.value;

  if (network.data.directed) return null;
  return network.data.edges.find(
    (item) =>
      item.sourceId === targetNodeId &&
      item.targetId === sourceNodeId,
  )?.value ?? null;
};
