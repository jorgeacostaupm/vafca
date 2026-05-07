import { Select, Space, Typography } from "antd";
import type { MatrixShape } from "@/types/matrix";
import { MATRIX_SHAPE_OPTIONS } from "@/components/management/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDatasetMatrixShape } from "@/store/slices/dataset";

function DatasetSummaryHeader() {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.dataset.data);
  const matrixShape = useAppSelector(
    (state) => state.visualizationUi.matrixShape,
  );

  if (!data) return null;

  return (
    <Space wrap size={16}>
      <Space size={6}>
        <Typography.Text strong>Matrices:</Typography.Text>
        <Typography.Text type="secondary">{data.matrixStats.total}</Typography.Text>
      </Space>

      <Space size={6}>
        <Typography.Text strong>Matrix shape:</Typography.Text>
        <Select
          size="small"
          value={matrixShape}
          options={MATRIX_SHAPE_OPTIONS}
          onChange={(value) =>
            void dispatch(setDatasetMatrixShape({ shape: value as MatrixShape }))
          }
        />
      </Space>
    </Space>
  );
}

export default DatasetSummaryHeader;
