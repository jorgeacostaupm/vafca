import { Tag, Typography } from "antd";
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
      <Typography.Text type="secondary" className="network-control-card__filters-label">
        Active filters
      </Typography.Text>
      {activeMask ? (
        <Tag
          color="blue"
          closable
          onClose={() => dispatch(clearNetworkEdgeFilter())}
        >
          ROI edges: {activeMask.selectedCount} / {activeMask.totalCount}
        </Tag>
      ) : null}
      {activeAggregatedMask ? (
        <Tag
          color="purple"
          closable
          onClose={() => dispatch(clearAggregatedNetworkEdgeFilter())}
        >
          Aggregated edges: {activeAggregatedMask.selectedCount} /{" "}
          {activeAggregatedMask.totalCount}
        </Tag>
      ) : null}
    </div>
  );
}
