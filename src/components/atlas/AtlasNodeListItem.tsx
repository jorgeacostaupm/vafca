import { Checkbox, List } from "antd";
import { memo, useCallback } from "react";
import { shallowEqual } from "react-redux";

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
  const { draft, labelsById, order } = useAppSelector(
    (state) => ({
      draft: state.visualizationUi.atlasPanel.nodeVisibilityDraft,
      labelsById: state.atlasUi.labelsById,
      order: state.atlasUi.order,
    }),
    shallowEqual,
  );
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
    <List.Item className="atlas-panel__node-row">
      <Checkbox
        className="atlas-panel__node-checkbox"
        checked={enabled}
        onChange={(event) => handleChange(event.target.checked)}
      >
        <span className="atlas-panel__node-label">{displayLabel}</span>
      </Checkbox>
    </List.Item>
  );
});
