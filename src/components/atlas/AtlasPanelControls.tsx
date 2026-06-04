import { Button, Space, Typography } from "antd";
import { useCallback, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLabelsEnabledMap } from "@/store/slices/atlasUi";
import { recomputeAggregatedMatricesForActiveRois } from "@/store/slices/dataset";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";

import {
  buildEffectiveRoiEnabledMap,
  countChangedRois,
} from "./roiVisibilityDraft";

type AtlasPanelControlsProps = {
  totalCount: number;
  enabledCount: number;
};

export function AtlasPanelControls({
  totalCount,
  enabledCount,
}: AtlasPanelControlsProps) {
  const dispatch = useAppDispatch();
  const { draft, labelsById, order } = useAppSelector((state) => ({
    draft: state.visualizationUi.atlasPanel.roiVisibilityDraft,
    labelsById: state.atlasUi.labelsById,
    order: state.atlasUi.order,
  }));
  const pendingCount = useMemo(
    () => countChangedRois({ order, labelsById, draft }),
    [draft, labelsById, order],
  );

  const handleApply = useCallback(() => {
    if (!draft) return;
    dispatch(
      setLabelsEnabledMap(
        buildEffectiveRoiEnabledMap({ order, labelsById, draft }),
      ),
    );
    dispatch(setAtlasPanelState({ roiVisibilityDraft: null }));
    void dispatch(recomputeAggregatedMatricesForActiveRois());
  }, [dispatch, draft, labelsById, order]);

  const handleDiscard = useCallback(() => {
    dispatch(setAtlasPanelState({ roiVisibilityDraft: null }));
  }, [dispatch]);

  return (
    <Space direction="vertical" size={2} style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Space direction="vertical" size={2}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            ROIs Management
          </Typography.Title>
          <Typography.Text type="secondary">
            {totalCount} ROIs · {enabledCount} active
          </Typography.Text>
        </Space>
        <Space>
          <Button
            type="primary"
            onClick={handleApply}
            disabled={pendingCount === 0}
          >
            Apply ROIs
          </Button>
          <Button onClick={handleDiscard} disabled={pendingCount === 0}>
            Discard
          </Button>
        </Space>
      </Space>
      {pendingCount > 0 ? (
        <Typography.Text type="secondary">
          {pendingCount} pending ROI visibility change
          {pendingCount === 1 ? "" : "s"}
        </Typography.Text>
      ) : null}
    </Space>
  );
}
