import { InputNumber, Space, Typography } from "antd";

type Props = {
  label: string;
  minInputValue: number | null | undefined;
  maxInputValue: number | null | undefined;
  minInputLabel: string;
  maxInputLabel: string;
  onMinInputChange: (value: number | null) => void;
  onMaxInputChange: (value: number | null) => void;
};

const normalizeInputValue = (value: string | number | null) =>
  typeof value === "number" ? value : null;

export default function MatrixFilterRangeControl({
  label,
  minInputValue,
  maxInputValue,
  minInputLabel,
  maxInputLabel,
  onMinInputChange,
  onMaxInputChange,
}: Props) {
  return (
    <div className="edge-filter-rule__range-row">
      <Typography.Text className="edge-filter-rule__range-label">
        {label}
      </Typography.Text>
      <Space.Compact className="edge-filter-rule__number-pair">
        <InputNumber
          aria-label={minInputLabel}
          placeholder="Min"
          value={minInputValue}
          onChange={(nextValue) => onMinInputChange(normalizeInputValue(nextValue))}
        />
        <InputNumber
          aria-label={maxInputLabel}
          placeholder="Max"
          value={maxInputValue}
          onChange={(nextValue) => onMaxInputChange(normalizeInputValue(nextValue))}
        />
      </Space.Compact>
    </div>
  );
}
