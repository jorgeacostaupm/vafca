import { Checkbox, List } from "antd";
import { memo, useCallback, useEffect } from "react";
import { shallowEqual } from "react-redux";

import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import {
  getAtlasDisplayLabel,
  isAtlasLabelEnabled,
} from "@/utils/atlas/labels";

import { buildEffectiveNodeEnabledMap } from "./nodeVisibilityDraft";
import RoiMetadataActions from "./RoiMetadataActions";

type AtlasNodeListItemProps = {
  id: string;
};

export const AtlasNodeListItem = memo(function AtlasNodeListItem({
  id,
}: AtlasNodeListItemProps) {
  const dispatch = useAppDispatch();
  const { nodeColors } = useAtlasLabelPresentation();
  const hasColoring = useAppSelector(state => state.atlasUi.colorFields.length > 0);
  const { draft, labelsById, order } = useAppSelector(
    (state) => ({
      draft: state.visualizationUi.atlasPanel.nodeVisibilityDraft,
      labelsById: state.atlasUi.labelsById,
      order: state.atlasUi.order,
    }),
    shallowEqual,
  );
  useEffect(() => () => { dispatch(setAtlasPanelState({ hoveredNodeId: null })); }, [dispatch, id]);
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
    <List.Item className="atlas-panel__node-row"
      onMouseEnter={() => dispatch(setAtlasPanelState({ hoveredNodeId: id }))}
      onMouseLeave={() => dispatch(setAtlasPanelState({ hoveredNodeId: null }))}
      onFocus={() => dispatch(setAtlasPanelState({ hoveredNodeId: id }))}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) dispatch(setAtlasPanelState({ hoveredNodeId: null }));
      }}
    >
      <Checkbox
        className="atlas-panel__node-checkbox"
        checked={enabled}
        onChange={(event) => handleChange(event.target.checked)}
      >
        <span className="atlas-panel__node-label" style={{ color: hasColoring ? nodeColors[id] : undefined }}>{displayLabel}</span>
      </Checkbox>
      <RoiMetadataActions id={id} />
    </List.Item>
  );
});
