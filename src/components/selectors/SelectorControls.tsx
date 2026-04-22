import { Button, Form, Select, Space, Typography } from "antd";

type Option = { value: string; label: string };

type SelectorControlsProps = {
  measures: Option[];
  populations: Option[];
  bands: Option[];
  stats: Option[];
  matrices: Option[];
  selection: {
    populationKey: string;
    measureId: string;
    statId: string;
    bandId: string;
    compoundId: string;
  };
  disabled: {
    measures: boolean;
    stats: boolean;
    bands: boolean;
  };
  showMatrixSelect: boolean;
  onChange: {
    populations: (value?: string) => void;
    measure: (value?: string) => void;
    stat: (value?: string) => void;
    band: (value?: string) => void;
    matrix: (value?: string) => void;
  };
  onAdd: () => void;
};

export default function SelectorControls({
  measures,
  populations,
  bands,
  stats,
  matrices,
  selection,
  disabled,
  showMatrixSelect,
  onChange,
  onAdd,
}: SelectorControlsProps) {
  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Typography.Text type="secondary">
        Select populations, measure, statistic, and band.
      </Typography.Text>

      <Form layout="vertical">
        <Form.Item label="Populations">
          <Select
            placeholder="Select populations..."
            value={selection.populationKey || undefined}
            onChange={onChange.populations}
            allowClear
            options={populations}
          />
        </Form.Item>

        <Form.Item label="Measure">
          <Select
            placeholder="Select a measure..."
            value={selection.measureId || undefined}
            onChange={onChange.measure}
            allowClear
            disabled={disabled.measures}
            options={measures}
          />
        </Form.Item>

        <Form.Item label="Statistic">
          <Select
            placeholder="Select a statistic..."
            value={selection.statId || undefined}
            onChange={onChange.stat}
            allowClear
            disabled={disabled.stats}
            options={stats}
          />
        </Form.Item>

        <Form.Item label="Band">
          <Select
            placeholder="Select a band..."
            value={selection.bandId || undefined}
            onChange={onChange.band}
            allowClear
            disabled={disabled.bands}
            options={bands}
          />
        </Form.Item>

        {showMatrixSelect && (
          <Form.Item label="Matrix">
            <Select
              placeholder="Select a matrix..."
              value={selection.compoundId || undefined}
              onChange={onChange.matrix}
              allowClear
              options={matrices}
            />
          </Form.Item>
        )}

        <Button type="primary" onClick={onAdd} disabled={!selection.compoundId}>
          Add view to layout
        </Button>
      </Form>
    </Space>
  );
}
