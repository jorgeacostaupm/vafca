import { Tabs } from "antd";
import type { ReactNode } from "react";
import type { HierarchySettingsContentMode } from "./hierarchySettingsTypes";

type HierarchySettingsFormTabsProps = {
  configurationLabel: string;
  renderSection: (contentMode: HierarchySettingsContentMode) => ReactNode;
};

export default function HierarchySettingsFormTabs({
  configurationLabel,
  renderSection,
}: HierarchySettingsFormTabsProps) {
  return (
    <Tabs
      size="small"
      items={[
        {
          key: "configuration",
          label: configurationLabel,
          children: renderSection("configuration"),
        },
        {
          key: "category-order",
          label: "Category order per branch",
          children: renderSection("categoryOrder"),
        },
      ]}
    />
  );
}
