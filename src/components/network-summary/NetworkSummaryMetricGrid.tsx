import { Typography } from "antd";

export type NetworkSummaryMetricItem = {
  key: string;
  label: string;
  value: string;
};

type Props = {
  title: string;
  items: NetworkSummaryMetricItem[];
};

export default function NetworkSummaryMetricGrid({ title, items }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="network-summary-section">
      <Typography.Text strong>{title}</Typography.Text>
      <div className="network-summary-metric-grid">
        {items.map((item) => (
          <div className="network-summary-metric" key={item.key}>
            <Typography.Text type="secondary">{item.label}</Typography.Text>
            <Typography.Text strong>{item.value}</Typography.Text>
          </div>
        ))}
      </div>
    </section>
  );
}
