import { Tag, Typography } from "antd";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearNetworkEdgeFilter,
} from "@/store/slices/networkFilters";

export default function NetworkFilterStatus() {
  const dispatch = useAppDispatch();
  const activeMask = useAppSelector(
    (state) => state.networkFilters.activeEdgeMask,
  );
  if (!activeMask) return null;

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
          Links: {activeMask.selectedCount} / {activeMask.totalCount}
        </Tag>
      ) : null}
    </div>
  );
}
