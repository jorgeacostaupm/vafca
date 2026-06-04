import { Tabs } from "antd";
import { useMemo } from "react";

import NetworkSummaryGroupTable from "@/components/network-summary/NetworkSummaryGroupTable";
import NetworkSummaryLinkTable from "@/components/network-summary/NetworkSummaryLinkTable";
import NetworkSummaryNodeTable from "@/components/network-summary/NetworkSummaryNodeTable";
import NetworkSummaryOverview from "@/components/network-summary/NetworkSummaryOverview";
import type {
  NetworkSummaryResult,
  NetworkSummarySettings,
} from "@/types/networkMeasures";

type Props = {
  summary: NetworkSummaryResult;
  settings: NetworkSummarySettings;
};

export default function NetworkSummaryResults({ summary, settings }: Props) {
  const items = useMemo(
    () => [
      {
        key: "overview",
        label: "Overview",
        children: <NetworkSummaryOverview summary={summary} settings={settings} />,
      },
      {
        key: "nodes",
        label: "Nodes",
        children: (
          <NetworkSummaryNodeTable
            topNodes={summary.topNodesByDegree}
            isolatedNodes={summary.isolatedNodes}
            settings={settings}
          />
        ),
      },
      {
        key: "links",
        label: "Links",
        children: (
          <NetworkSummaryLinkTable
            topAbs={summary.topLinksByAbsoluteValue}
            topPositive={summary.topPositiveLinks}
            topNegative={summary.topNegativeLinks}
            settings={settings}
          />
        ),
      },
      {
        key: "groups",
        label: "Groups",
        children: (
          <NetworkSummaryGroupTable
            groups={summary.groups}
            grouping={summary.grouping}
            settings={settings}
          />
        ),
      },
    ],
    [settings, summary],
  );

  return (
    <Tabs
      className="network-summary-results"
      defaultActiveKey="overview"
      items={items}
    />
  );
}
