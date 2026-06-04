import { Alert, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import type {
  NetworkGroupSummary,
  NetworkSummaryGrouping,
  NetworkSummarySettings,
} from "@/types/networkMeasures";

import {
  formatSummaryNumber,
  formatSummaryPercent,
} from "./networkSummaryFormat";

type Props = {
  groups: NetworkGroupSummary[];
  grouping: NetworkSummaryGrouping;
  settings: NetworkSummarySettings;
};

const columns: ColumnsType<NetworkGroupSummary> = [
  {
    title: "Group",
    dataIndex: "label",
    key: "label",
  },
  {
    title: "ROIs",
    dataIndex: "roiCount",
    key: "roiCount",
    render: formatSummaryNumber,
  },
  {
    title: "Internal links",
    dataIndex: "internalEdgeCount",
    key: "internalEdgeCount",
    render: formatSummaryNumber,
  },
  {
    title: "Internal density",
    dataIndex: "internalDensity",
    key: "internalDensity",
    render: formatSummaryPercent,
  },
  {
    title: "External links",
    dataIndex: "externalEdgeCount",
    key: "externalEdgeCount",
    render: formatSummaryNumber,
  },
  {
    title: "External density",
    dataIndex: "externalDensity",
    key: "externalDensity",
    render: formatSummaryPercent,
  },
];

export default function NetworkSummaryGroupTable({
  groups,
  grouping,
  settings,
}: Props) {
  if (!settings.visibleFields["groups.summary"]?.summaryTab) return null;

  return (
    <section className="network-summary-section">
      <Typography.Text strong>Atlas groups</Typography.Text>
      {grouping.source === "unavailable" ? (
        <Alert
          type="info"
          showIcon
          message={grouping.unavailableReason ?? "No grouping field is available."}
        />
      ) : (
        <>
          <Typography.Text type="secondary">
            Grouping: {grouping.fields.join(" / ")}
          </Typography.Text>
          <Table
            className="network-summary-table"
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={groups}
            pagination={false}
          />
        </>
      )}
    </section>
  );
}
