import { Select, Space, Typography } from "antd";

import {
  D3_GROUPING_PALETTES,
  type D3GroupingPaletteKey,
} from "@/config/groupingPalettes";

type GroupingPaletteSelectProps = {
  value: D3GroupingPaletteKey;
  onChange: (value: D3GroupingPaletteKey) => void;
};

export default function GroupingPaletteSelect({
  value,
  onChange,
}: GroupingPaletteSelectProps) {
  return (
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      <Typography.Text type="secondary">Palette</Typography.Text>
      <Select
        value={value}
        style={{ width: "100%" }}
        onChange={(nextValue) => onChange(nextValue as D3GroupingPaletteKey)}
        options={Object.entries(D3_GROUPING_PALETTES).map(([key, palette]) => ({
          value: key,
          label: palette.label,
        }))}
      />
    </Space>
  );
}
