import { memo, useCallback } from "react";
import { List, Switch } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLabelEnabled } from "@/store/slices/atlas";
import {
  getAtlasDisplayLabel,
  isAtlasLabelEnabled,
} from "@/utils/atlas/labels";

type AtlasRoiListItemProps = {
  id: string;
};

export const AtlasRoiListItem = memo(function AtlasRoiListItem({
  id,
}: AtlasRoiListItemProps) {
  const dispatch = useAppDispatch();
  const labelMeta = useAppSelector((state) => state.atlas.labelsById[id]);
  const displayLabel = getAtlasDisplayLabel(labelMeta, id);
  const enabled = isAtlasLabelEnabled(labelMeta);

  const handleChange = useCallback(
    (checked: boolean) => {
      dispatch(setLabelEnabled({ id, enabled: checked }));
    },
    [dispatch, id],
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
