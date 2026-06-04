import { List, Switch } from "antd";
import { memo, useCallback } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import {
  getAtlasDisplayLabel,
  isAtlasLabelEnabled,
} from "@/utils/atlas/labels";

import { buildEffectiveRoiEnabledMap } from "./roiVisibilityDraft";

type AtlasRoiListItemProps = {
  id: string;
};

export const AtlasRoiListItem = memo(function AtlasRoiListItem({
  id,
}: AtlasRoiListItemProps) {
  const dispatch = useAppDispatch();
  const { draft, labelsById, order } = useAppSelector((state) => ({
    draft: state.visualizationUi.atlasPanel.roiVisibilityDraft,
    labelsById: state.atlasUi.labelsById,
    order: state.atlasUi.order,
  }));
  const labelMeta = labelsById[id];
  const displayLabel = getAtlasDisplayLabel(labelMeta, id);
  const enabled = draft?.[id] ?? isAtlasLabelEnabled(labelMeta);

  const handleChange = useCallback(
    (checked: boolean) => {
      dispatch(
        setAtlasPanelState({
          roiVisibilityDraft: {
            ...buildEffectiveRoiEnabledMap({ order, labelsById, draft }),
            [id]: checked,
          },
        }),
      );
    },
    [dispatch, draft, id, labelsById, order],
  );

  return (
    <List.Item
      actions={[
        <Switch
          key={`toggle-${id}`}
          checked={enabled}
          onChange={handleChange}
          aria-label={`Toggle ${displayLabel}`}
        />,
      ]}
    >
      <List.Item.Meta title={displayLabel} />
    </List.Item>
  );
});
