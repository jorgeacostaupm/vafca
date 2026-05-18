import { Card, Col, InputNumber, Row, Select, Slider, Space, Tag, Typography } from "antd";
import { resolveMatrixUiRange } from "@/utils/matrixUiRange";
import type { Catalogs, MatrixRecord } from "@/types/connectivityBundle";
import type { MatrixFilterRule } from "@/types/edgeFilter";
import { formatMatrixKindLabel, formatNetworkMatrixLabel, formatMatrixSourceLabel } from "./edgeFilterLabels";

type MatrixOptionGroup = {
  label: string;
  options: { value: string; label: string; searchText: string }[];
};

type Props = {
  rule: MatrixFilterRule;
  matrices: MatrixRecord[];
  matrixGroups: MatrixOptionGroup[];
  catalogs?: Catalogs;
  uiRangeMode: "logical_default" | "observed";
  includeDiagonal: boolean;
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
  includeDiagonal,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const matrix = matrices.find((item) => item.id === rule.matrixId);
  const range = matrix
    ? resolveMatrixUiRange(matrix, catalogs, {
        uiRangeMode,
        includeDiagonal,
        target: "slider",
      })
    : { min: -1, max: 1 };
  const rangeModeLabel =
    "source" in range && range.source === "observed" ? "Observed" : "Logical default";
  const isDivergent = "scaleType" in range && range.scaleType === "diverging";
  const stats = matrix?.dataStats?.[includeDiagonal ? "allValues" : "offDiagonal"];

  const setValue = <K extends keyof MatrixFilterRule>(key: K, value: MatrixFilterRule[K]) =>
    onChange({ ...rule, [key]: value });

  const configureForMatrix = (matrixId: string) => {
    const nextMatrix = matrices.find((item) => item.id === matrixId);
    if (!nextMatrix) {
      onChange({ ...rule, matrixId, operator: "between" });
      return;
    }

    const nextRange = resolveMatrixUiRange(nextMatrix, catalogs, {
      uiRangeMode,
      includeDiagonal,
      target: "slider",
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

  return (
    <Card size="small" className="edge-filter-rule">
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} lg={16}>
            <Typography.Text strong>Matrix</Typography.Text>
            <Select
              showSearch
              value={rule.matrixId || undefined}
              placeholder="Select a matrix"
              options={matrixGroups}
              optionFilterProp="searchText"
              style={{ width: "100%", marginTop: 6 }}
              onChange={configureForMatrix}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Typography.Text strong>Actions</Typography.Text>
            <Space wrap style={{ width: "100%", marginTop: 6 }}>
              <a onClick={onMoveUp}>Move up</a>
              <a onClick={onMoveDown}>Move down</a>
              <a onClick={onDelete}>Delete rule</a>
            </Space>
          </Col>
        </Row>

        {matrix ? (
          <div className="edge-filter-rule__metadata">
            <Typography.Text strong>{formatNetworkMatrixLabel(matrix, catalogs)}</Typography.Text>
            <div>
              <Tag>{formatMatrixKindLabel(matrix)}</Tag>
              <Tag>{formatMatrixSourceLabel(matrix, catalogs)}</Tag>
              <Tag>{matrix.geometry.shape.join("x")}</Tag>
              <Tag>{rangeModeLabel}</Tag>
            </div>
            <Typography.Text type="secondary">
              Band: {matrix.context.bandId ?? "None"} · Measure: {matrix.context.measureId} · Statistic:{" "}
              {matrix.stat.id}
              {typeof matrix.source === "object" && "n" in matrix.source ? ` · n: ${matrix.source.n}` : ""}
              {stats?.min !== null && stats?.max !== null
                ? ` · Observed range: ${stats?.min} - ${stats?.max}`
                : ""}
            </Typography.Text>
          </div>
        ) : null}

        {isDivergent ? (
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Typography.Text>Negative range</Typography.Text>
              <Slider
                range
                min={range.min}
                max={Math.min(0, range.max)}
                step={0.01}
                value={[rule.negativeMin ?? range.min, rule.negativeMax ?? 0]}
                onChange={([negativeMin, negativeMax]) =>
                  onChange({ ...rule, negativeMin, negativeMax })
                }
              />
              <Space.Compact block>
                <InputNumber value={rule.negativeMin} onChange={(value) => setValue("negativeMin", value)} />
                <InputNumber value={rule.negativeMax} onChange={(value) => setValue("negativeMax", value)} />
              </Space.Compact>
            </Col>
            <Col xs={24} md={12}>
              <Typography.Text>Positive range</Typography.Text>
              <Slider
                range
                min={Math.max(0, range.min)}
                max={range.max}
                step={0.01}
                value={[rule.positiveMin ?? 0, rule.positiveMax ?? range.max]}
                onChange={([positiveMin, positiveMax]) =>
                  onChange({ ...rule, positiveMin, positiveMax })
                }
              />
              <Space.Compact block>
                <InputNumber value={rule.positiveMin} onChange={(value) => setValue("positiveMin", value)} />
                <InputNumber value={rule.positiveMax} onChange={(value) => setValue("positiveMax", value)} />
              </Space.Compact>
            </Col>
          </Row>
        ) : (
          <Row gutter={[12, 12]}>
            <Col xs={24}>
              <Typography.Text>Value range</Typography.Text>
              <Slider
                range
                min={range.min}
                max={range.max}
                step={0.01}
                value={[rule.min ?? range.min, rule.max ?? range.max]}
                onChange={([min, max]) =>
                  onChange({ ...rule, operator: "between", min, max })
                }
              />
            </Col>
            <Col xs={24} md={12}>
              <InputNumber
                value={rule.min}
                onChange={(value) => setValue("min", value)}
                style={{ width: "100%" }}
              />
            </Col>
            <Col xs={24} md={12}>
              <InputNumber
                value={rule.max}
                onChange={(value) => setValue("max", value)}
                style={{ width: "100%" }}
              />
            </Col>
          </Row>
        )}
      </Space>
    </Card>
  );
}
