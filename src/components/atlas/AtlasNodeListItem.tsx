import { Button, Checkbox, List } from "antd";
import { memo, useCallback, useEffect } from "react";
import { shallowEqual } from "react-redux";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveAnnotation, setAtlasPanelState, toggleAnnotationNode } from "@/store/slices/visualizationUi";
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
  const annotated = useAppSelector(state => selectActiveAnnotation(state)?.nodes.some(node => node.id === id) ?? false);
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
        <span className="atlas-panel__node-label">{displayLabel}</span>
      </Checkbox>
      <Button aria-label={`Annotate ${displayLabel}`} aria-pressed={annotated} onClick={() => dispatch(toggleAnnotationNode({ id, label: displayLabel }))}>Annotate</Button>
      <RoiMetadataActions id={id} />
    </List.Item>
  );
});
