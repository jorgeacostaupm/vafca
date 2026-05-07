import type { MatrixUploadError } from "@/types/datasetState";
import type { ConnectivityMatrix } from "@/types/matrix";
import type { MatrixOrderItem } from "@/types/matrixOrder";
import { buildMatrixOrderItemsFromSize } from "@/utils/atlas/matrixDerivedAtlas";
import { extractMatrixOrderFromPayload } from "@/utils/matrixValidation";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

type ResolveResetMatrixOrderArgs = {
  source: string;
  payload: unknown;
  inferredMatrixOrder: MatrixOrderItem[] | null;
  errors: MatrixUploadError[];
};

type AcceptMatricesArgs = {
  source: string;
  matrices: ConnectivityMatrix[];
  inferredMatrixOrder: MatrixOrderItem[] | null;
  errors: MatrixUploadError[];
};

type ResetMatrixOrderResolution = {
  inferredMatrixOrder: MatrixOrderItem[] | null;
  validationMatrixOrder: MatrixOrderItem[];
};

type AcceptedMatricesResult = {
  acceptedMatrices: ConnectivityMatrix[];
  inferredMatrixOrder: MatrixOrderItem[] | null;
};

const matrixOrderMatches = (
  left: MatrixOrderItem[],
  right: MatrixOrderItem[],
) => {
  const leftIds = normalizeMatrixOrder(left).map((entry) => entry.id);
  const rightIds = normalizeMatrixOrder(right).map((entry) => entry.id);
  return (
    leftIds.length === rightIds.length &&
    leftIds.every((id, index) => id === rightIds[index])
  );
};

export const resolveResetMatrixOrder = ({
  source,
  payload,
  inferredMatrixOrder,
  errors,
}: ResolveResetMatrixOrderArgs): ResetMatrixOrderResolution => {
  const payloadMatrixOrder = extractMatrixOrderFromPayload(payload);
  if (payloadMatrixOrder.length === 0) {
    return {
      inferredMatrixOrder,
      validationMatrixOrder: inferredMatrixOrder ?? [],
    };
  }

  if (!inferredMatrixOrder) {
    return {
      inferredMatrixOrder: payloadMatrixOrder,
      validationMatrixOrder: payloadMatrixOrder,
    };
  }

  if (!matrixOrderMatches(inferredMatrixOrder, payloadMatrixOrder)) {
    errors.push({
      source,
      message:
        "metadata.matrixOrder does not match the matrix order already inferred for this upload.",
    });
  }

  return {
    inferredMatrixOrder,
    validationMatrixOrder: inferredMatrixOrder,
  };
};

export const acceptMatricesForMatrixDerivedAtlas = ({
  source,
  matrices,
  inferredMatrixOrder,
  errors,
}: AcceptMatricesArgs): AcceptedMatricesResult => {
  const acceptedMatrices: ConnectivityMatrix[] = [];
  let nextMatrixOrder = inferredMatrixOrder;

  for (const matrix of matrices) {
    if (!nextMatrixOrder) {
      nextMatrixOrder = buildMatrixOrderItemsFromSize(matrix.data.length);
    }

    const expectedSize = normalizeMatrixOrder(nextMatrixOrder).length;
    if (matrix.data.length !== expectedSize) {
      errors.push({
        source,
        matrixId: matrix.id,
        message: `'data' must have ${expectedSize} rows to match the inferred matrix order.`,
      });
      continue;
    }

    acceptedMatrices.push(matrix);
  }

  return {
    acceptedMatrices,
    inferredMatrixOrder: nextMatrixOrder,
  };
};
