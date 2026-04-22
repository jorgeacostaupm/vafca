import { Select, Space, Typography } from "antd";
import type { MatrixShape } from "@/types/matrix";
import { MATRIX_SHAPE_OPTIONS } from "@/components/management/constants";

type DatasetSummaryHeaderProps = {
  atlasLabel: string;
  roiCount: number;
  matrixCount: number;
  matrixShape: MatrixShape;
  onMatrixShapeChange: (value: MatrixShape) => void;
};

function DatasetSummaryHeader({
  atlasLabel,
  roiCount,
  matrixCount,
  matrixShape,
  onMatrixShapeChange,
}: DatasetSummaryHeaderProps) {
  return (
    <Space wrap size={16}>
      <Space size={6}>
        <Typography.Text strong>Atlas:</Typography.Text>
        <Typography.Text type="secondary">{atlasLabel}</Typography.Text>
      </Space>

      <Space size={6}>
        <Typography.Text strong>ROI count:</Typography.Text>
        <Typography.Text type="secondary">{roiCount}</Typography.Text>
      </Space>

      <Space size={6}>
        <Typography.Text strong>Matrices:</Typography.Text>
        <Typography.Text type="secondary">{matrixCount}</Typography.Text>
      </Space>

      <Space size={6}>
        <Typography.Text strong>Matrix shape:</Typography.Text>
        <Select
          size="small"
          value={matrixShape}
          options={MATRIX_SHAPE_OPTIONS}
          onChange={(value) => onMatrixShapeChange(value as MatrixShape)}
        />
      </Space>
    </Space>
  );
}

export default DatasetSummaryHeader;
