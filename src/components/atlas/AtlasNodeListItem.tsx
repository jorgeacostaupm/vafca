import { List, Switch } from "antd";
import { memo, useCallback } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import {
  getAtlasDisplayLabel,
  isAtlasLabelEnabled,
} from "@/utils/atlas/labels";

import { buildEffectiveNodeEnabledMap } from "./nodeVisibilityDraft";

type AtlasNodeListItemProps = {
  id: string;
};

export const AtlasNodeListItem = memo(function AtlasNodeListItem({
  id,
}: AtlasNodeListItemProps) {
  const dispatch = useAppDispatch();
  const { draft, labelsById, order } = useAppSelector((state) => ({
    draft: state.visualizationUi.atlasPanel.nodeVisibilityDraft,
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
          nodeVisibilityDraft: {
            ...buildEffectiveNodeEnabledMap({ order, labelsById, draft }),
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
