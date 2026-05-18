import { Space, Tag, Typography } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearAggregatedNetworkEdgeFilter,
  clearNetworkEdgeFilter,
} from "@/store/slices/networkVisualization";

export default function NetworkFilterStatus() {
  const dispatch = useAppDispatch();
  const activeMask = useAppSelector(
    (state) => state.networkVisualization.activeEdgeMask,
  );
  const activeAggregatedMask = useAppSelector(
    (state) => state.networkVisualization.activeAggregatedEdgeMask,
  );

  if (!activeMask && !activeAggregatedMask) return null;

  return (
    <div className="network-control-card__filters">
      {activeMask ? (
        <Space wrap>
          <Tag color="blue">
            Filter active: {activeMask.selectedCount} / {activeMask.totalCount}{" "}
            edges
          </Tag>
          <Typography.Link onClick={() => dispatch(clearNetworkEdgeFilter())}>
            Clear filter
          </Typography.Link>
        </Space>
      ) : null}
      {activeAggregatedMask ? (
        <Space wrap>
          <Tag color="purple">
            Aggregated filter active: {activeAggregatedMask.selectedCount} /{" "}
            {activeAggregatedMask.totalCount} edges
          </Tag>
          <Typography.Link
            onClick={() => dispatch(clearAggregatedNetworkEdgeFilter())}
          >
            Clear aggregated filter
          </Typography.Link>
        </Space>
      ) : null}
    </div>
  );
}
