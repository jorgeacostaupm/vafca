import {
  ApartmentOutlined,
  DotChartOutlined,
  LineChartOutlined,
  PartitionOutlined,
} from "@ant-design/icons";
import { Tag, Typography } from "antd";
import type { ReactNode } from "react";

import type {
  NetworkSummaryFieldId,
  NetworkSummaryResult,
  NetworkSummarySettings,
} from "@/types/networkMeasures";

import {
  formatSummaryBoolean,
  formatSummaryNumber,
  formatSummaryPercent,
} from "./networkSummaryFormat";

type Props = {
  summary: NetworkSummaryResult;
  settings: NetworkSummarySettings;
};

type ExecutiveMetric = {
  fieldId: NetworkSummaryFieldId;
  label: string;
  value: string;
  icon: ReactNode;
};

export default function NetworkSummaryExecutive({ summary, settings }: Props) {
  const visible = (fieldId: NetworkSummaryFieldId) =>
    settings.visibleFields[fieldId]?.summaryTab ?? false;

  const executiveMetrics: ExecutiveMetric[] = [
    {
      fieldId: "coverage.nodeCount",
      label: "Nodes",
      value: formatSummaryNumber(summary.coverage.nodeCount),
      icon: <ApartmentOutlined />,
    },
    {
      fieldId: "coverage.usedEdgeCount",
      label: "Used links",
      value: formatSummaryNumber(summary.coverage.usedEdgeCount),
      icon: <LineChartOutlined />,
    },
    {
      fieldId: "coverage.density",
      label: "Density",
      value: formatSummaryPercent(summary.coverage.density),
      icon: <DotChartOutlined />,
    },
    {
      fieldId: "global.meanDegree",
      label: "Mean degree",
      value: formatSummaryNumber(summary.global.meanDegree),
      icon: <PartitionOutlined />,
    },
    {
      fieldId: "global.componentCount",
      label: "Components",
      value: formatSummaryNumber(summary.global.componentCount),
      icon: <ApartmentOutlined />,
    },
  ];
  const metrics = executiveMetrics.filter((metric) => visible(metric.fieldId));

  return (
    <section className="network-summary-executive">
      <div className="network-summary-executive__identity">
        <div className="network-summary-executive__title-row">
          <Typography.Title level={4}>
            {summary.identity.label}
          </Typography.Title>
          <Tag>{summary.identity.kind}</Tag>
          <Tag>{summary.identity.networkKind}</Tag>
        </div>
        <div className="network-summary-executive__metadata">
          <Typography.Text type="secondary">
            {summary.identity.populationLabel}
          </Typography.Text>
          <Typography.Text type="secondary">
            {summary.identity.measureLabel}
          </Typography.Text>
          <Typography.Text type="secondary">
            {summary.identity.statisticLabel}
          </Typography.Text>
          <Typography.Text type="secondary">
            {summary.identity.layerLabel}
          </Typography.Text>
          <Typography.Text type="secondary">
            {summary.identity.dataSize}
          </Typography.Text>
          <Typography.Text type="secondary">
            {formatSummaryBoolean(summary.identity.symmetric)} symmetric
          </Typography.Text>
        </div>
      </div>

      {metrics.length > 0 ? (
        <div className="network-summary-executive__metrics">
          {metrics.map((metric) => (
            <div className="network-summary-executive__metric" key={metric.fieldId}>
              <span className="network-summary-executive__metric-icon">
                {metric.icon}
              </span>
              <span className="network-summary-executive__metric-text">
                <Typography.Text type="secondary">{metric.label}</Typography.Text>
                <Typography.Text strong>{metric.value}</Typography.Text>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
