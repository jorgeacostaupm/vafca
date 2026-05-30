import {
  AppstoreOutlined,
  BranchesOutlined,
  Loading3QuartersOutlined,
} from "@ant-design/icons";
import type React from "react";
import { createNetworkSegmentedOption } from "@/components/network/segmentedOption";
import type { NetworkViewType } from "@/types/networkVisualization";

type ViewTypeOption = {
  value: NetworkViewType;
  label: React.ReactNode;
};

const viewTypeIcons: Record<NetworkViewType, React.ReactNode> = {
  matrix: <AppstoreOutlined />,
  circular: <Loading3QuartersOutlined />,
  classic: <BranchesOutlined />,
};

export const networkViewTypeOptions: ViewTypeOption[] = [
  createNetworkSegmentedOption("matrix", <AppstoreOutlined />, "Matrix"),
  createNetworkSegmentedOption("circular", <Loading3QuartersOutlined />, "Circular"),
  createNetworkSegmentedOption("classic", <BranchesOutlined />, "Node-Link"),
];

export const networkViewTypeIconOptions = networkViewTypeOptions.map(
  ({ value }) => ({
    value,
    label: (
      <span className="network-view-type-option">
        {viewTypeIcons[value]}
      </span>
    ),
  }),
);
