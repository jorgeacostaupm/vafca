import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Select, Space, Tooltip, Typography } from "antd";

import type { Catalogs, ConnectivityMatrix, UiRangeMode } from "@/types/connectivityBundle";
import type { MatrixFilterRule } from "@/types/edgeFilter";
import { resolveValueDomain } from "@/utils/valueDomain";

import MatrixFilterRangeControl from "./MatrixFilterRangeControl";

type MatrixOptionGroup = {
  label: string;
  options: { value: string; label: string; searchText: string }[];
};

type Props = {
  rule: MatrixFilterRule;
  matrices: ConnectivityMatrix[];
  matrixGroups: MatrixOptionGroup[];
  catalogs?: Catalogs;
  uiRangeMode: UiRangeMode;
  onChange: (rule: MatrixFilterRule) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export default function MatrixFilterRuleEditor({
  rule,
  matrices,
  matrixGroups,
  catalogs,
  uiRangeMode,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const matrix = matrices.find((item) => item.id === rule.matrixId);
  const range = matrix
    ? resolveValueDomain({
        matrix,
        catalogs,
        mode: uiRangeMode,
      })
    : { min: -1, max: 1 };
  const isDivergent = "scaleType" in range && range.scaleType === "diverging";

  const setValue = <K extends keyof MatrixFilterRule>(key: K, value: MatrixFilterRule[K]) =>
    onChange({ ...rule, [key]: value });

  const configureForMatrix = (matrixId: string) => {
    const nextMatrix = matrices.find((item) => item.id === matrixId);
    if (!nextMatrix) {
      onChange({ ...rule, matrixId, operator: "between" });
      return;
    }

    const nextRange = resolveValueDomain({
      matrix: nextMatrix,
      catalogs,
      mode: uiRangeMode,
    });
    if (nextRange.scaleType === "diverging") {
      onChange({
        ...rule,
        matrixId,
        operator: "negative_and_positive_ranges",
        min: null,
        max: null,
        negativeMin: nextRange.min,
        negativeMax: Math.min(0, nextRange.max),
        positiveMin: Math.max(0, nextRange.min),
        positiveMax: nextRange.max,
      });
      return;
    }

    onChange({
      ...rule,
      matrixId,
      operator: "between",
      min: nextRange.min,
      max: nextRange.max,
      negativeMin: null,
      negativeMax: null,
      positiveMin: null,
      positiveMax: null,
    });
  };

  const rangeControl = isDivergent ? (
    <Space size={8} className="edge-filter-rule__ranges">
      <MatrixFilterRangeControl
        label="Negative"
        minInputValue={rule.negativeMin}
        maxInputValue={rule.negativeMax}
        minInputLabel="Negative minimum"
        maxInputLabel="Negative maximum"
        onMinInputChange={(value) => setValue("negativeMin", value)}
        onMaxInputChange={(value) => setValue("negativeMax", value)}
      />
      <MatrixFilterRangeControl
        label="Positive"
        minInputValue={rule.positiveMin}
        maxInputValue={rule.positiveMax}
        minInputLabel="Positive minimum"
        maxInputLabel="Positive maximum"
        onMinInputChange={(value) => setValue("positiveMin", value)}
        onMaxInputChange={(value) => setValue("positiveMax", value)}
      />
    </Space>
  ) : (
    <MatrixFilterRangeControl
      label="Range"
      minInputValue={rule.min}
      maxInputValue={rule.max}
      minInputLabel="Minimum value"
      maxInputLabel="Maximum value"
      onMinInputChange={(value) => onChange({ ...rule, operator: "between", min: value })}
      onMaxInputChange={(value) => onChange({ ...rule, operator: "between", max: value })}
    />
  );

  return (
    <Card size="small" className="edge-filter-rule">
      <div className="edge-filter-rule__controls">
        <div className="edge-filter-rule__matrix-select">
          <Typography.Text className="edge-filter-rule__field-label">
            Network
          </Typography.Text>
          <Select
            showSearch
            value={rule.matrixId || undefined}
            placeholder="Select a matrix"
            options={matrixGroups}
            optionFilterProp="searchText"
            style={{ width: "100%" }}
            onChange={configureForMatrix}
          />
        </div>

        {rangeControl}

        <Space wrap className="edge-filter-rule__actions">
          <Tooltip title="Move up">
            <Button
              aria-label="Move rule up"
              icon={<ArrowUpOutlined />}
              onClick={onMoveUp}
            />
          </Tooltip>
          <Tooltip title="Move down">
            <Button
              aria-label="Move rule down"
              icon={<ArrowDownOutlined />}
              onClick={onMoveDown}
            />
          </Tooltip>
          <Tooltip title="Delete rule">
            <Button
              aria-label="Delete rule"
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
            />
          </Tooltip>
        </Space>
      </div>
    </Card>
  );
}
