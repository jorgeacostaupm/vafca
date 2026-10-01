import { Form, Switch, Typography } from "antd";

import DebouncedRangeSlider from "@/components/common/DebouncedRangeSlider";
import { RANGE_FILTER_PRECISION, RANGE_FILTER_STEP } from "@/config/ui";
import type { StatRangeValue } from "@/types/matrixView";

type Props = {
  value?: StatRangeValue;
  split: boolean;
  center: number;
  min: number;
  max: number;
  onChange: (value: [number, number], segment?: "negative" | "positive", enabled?: boolean) => void;
};

export default function NetworkRangeFilter({ value, split, center, min, max, onChange }: Props) {
  if (!value) return <Typography.Text type="secondary">No range available.</Typography.Text>;
  const segments = split ? (["negative", "positive"] as const) : [undefined];
  return segments.map((segment) => {
    const label = segment === "negative" ? "Negative range" : segment === "positive" ? "Positive range" : "Range";
    const lower = segment === "positive" ? center : min;
    const upper = segment === "negative" ? center : max;
    const range: [number, number] = segment && !Array.isArray(value)
      ? value[segment] : Array.isArray(value) ? value : [lower, upper];
    const enabled = !segment || Array.isArray(value) || value[`${segment}Enabled`] !== false;
    return (
      <Form.Item key={segment ?? "range"} label={label}>
        {segment && (
          <Switch
            size="small"
            aria-label={`Enable ${label.toLowerCase()}`}
            checked={enabled}
            onChange={(checked) => onChange(range, segment, checked)}
          />
        )}
        <DebouncedRangeSlider
          label={label}
          min={lower}
          max={upper}
          step={RANGE_FILTER_STEP}
          value={range}
          disabled={!enabled}
          onChange={(next) => onChange(next, segment)}
          tooltip={{ formatter: (number) => number?.toFixed(RANGE_FILTER_PRECISION) }}
        />
      </Form.Item>
    );
  });
}
