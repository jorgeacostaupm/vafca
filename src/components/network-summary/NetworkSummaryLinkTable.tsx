import { Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import type {
  NetworkLinkSummary,
  NetworkSummarySettings,
} from "@/types/networkMeasures";

import { formatSummaryNumber } from "./networkSummaryFormat";

type Props = {
  topAbs: NetworkLinkSummary[];
  topPositive: NetworkLinkSummary[];
  topNegative: NetworkLinkSummary[];
  settings: NetworkSummarySettings;
};

const columns: ColumnsType<NetworkLinkSummary> = [
  {
    title: "Source",
    dataIndex: "sourceLabel",
    key: "sourceLabel",
  },
  {
    title: "Target",
    dataIndex: "targetLabel",
    key: "targetLabel",
  },
  {
    title: "Source group",
    dataIndex: "sourceGroupLabel",
    key: "sourceGroupLabel",
    render: (value?: string) => value ?? "n/a",
  },
  {
    title: "Target group",
    dataIndex: "targetGroupLabel",
    key: "targetGroupLabel",
    render: (value?: string) => value ?? "n/a",
  },
  {
    title: "Value",
    dataIndex: "value",
    key: "value",
    render: formatSummaryNumber,
    sorter: (left, right) => left.value - right.value,
  },
];

const LinkTableBlock = ({
  title,
  data,
}: {
  title: string;
  data: NetworkLinkSummary[];
}) => (
  <div className="network-summary-table-block">
    <Typography.Text type="secondary">{title}</Typography.Text>
    <Table
      className="network-summary-table"
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={data}
      pagination={false}
    />
  </div>
);

export default function NetworkSummaryLinkTable({
  topAbs,
  topPositive,
  topNegative,
  settings,
}: Props) {
  const showAbs = settings.visibleFields["links.topAbs"]?.summaryTab;
  const showPositive = settings.visibleFields["links.topPositive"]?.summaryTab;
  const showNegative = settings.visibleFields["links.topNegative"]?.summaryTab;

  if (!showAbs && !showPositive && !showNegative) return null;

  return (
    <section className="network-summary-section">
      <Typography.Text strong>Highlighted links</Typography.Text>
      {showAbs ? <LinkTableBlock title="Top links by absolute value" data={topAbs} /> : null}
      {showPositive ? <LinkTableBlock title="Top positive links" data={topPositive} /> : null}
      {showNegative ? <LinkTableBlock title="Top negative links" data={topNegative} /> : null}
    </section>
  );
}
