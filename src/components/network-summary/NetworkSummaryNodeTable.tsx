import { Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import type {
  NetworkNodeSummary,
  NetworkSummarySettings,
} from "@/types/networkMeasures";

import { formatSummaryNumber } from "./networkSummaryFormat";

type Props = {
  topNodes: NetworkNodeSummary[];
  isolatedNodes: NetworkNodeSummary[];
  settings: NetworkSummarySettings;
};

const columns: ColumnsType<NetworkNodeSummary> = [
  {
    title: "ROI",
    dataIndex: "label",
    key: "label",
  },
  {
    title: "Group",
    dataIndex: "groupLabel",
    key: "groupLabel",
    render: (value?: string) => value ?? "n/a",
  },
  {
    title: "Degree",
    dataIndex: "degree",
    key: "degree",
    render: formatSummaryNumber,
    sorter: (left, right) => left.degree - right.degree,
  },
  {
    title: "Clustering",
    dataIndex: "clustering",
    key: "clustering",
    render: formatSummaryNumber,
  },
];

const isolatedColumns: ColumnsType<NetworkNodeSummary> = [
  {
    title: "ROI",
    dataIndex: "label",
    key: "label",
  },
  {
    title: "Group",
    dataIndex: "groupLabel",
    key: "groupLabel",
    render: (value?: string) => value ?? "n/a",
  },
];

export default function NetworkSummaryNodeTable({
  topNodes,
  isolatedNodes,
  settings,
}: Props) {
  const showTop = settings.visibleFields["nodes.topByDegree"]?.summaryTab;
  const showIsolated = settings.visibleFields["nodes.isolated"]?.summaryTab;

  if (!showTop && !showIsolated) return null;

  return (
    <section className="network-summary-section">
      <Typography.Text strong>ROIs and nodes</Typography.Text>
      {showTop ? (
        <div className="network-summary-table-block">
          <Typography.Text type="secondary">Top ROIs by degree</Typography.Text>
          <Table
            className="network-summary-table"
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={topNodes}
            pagination={false}
          />
        </div>
      ) : null}
      {showIsolated ? (
        <div className="network-summary-table-block">
          <Typography.Text type="secondary">Isolated ROIs</Typography.Text>
          <Table
            className="network-summary-table"
            rowKey="id"
            size="small"
            columns={isolatedColumns}
            dataSource={isolatedNodes}
            pagination={false}
          />
        </div>
      ) : null}
    </section>
  );
}
