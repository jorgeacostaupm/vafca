import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Alert, Button, Modal, Select, Space, Switch, Typography } from "antd";
import { useCallback, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import {
  atlasSupports3d,
  getCommonRoiFields,
  getDefaultGroupByFields,
  humanizeFieldName,
} from "@/utils/atlas/atlasDefinition";

import { useActiveAtlasDefinition } from "./hooks/useActiveAtlasDefinition";
import { moveField } from "./panelFieldUtils";

type AtlasPanelSettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AtlasPanelSettingsModal({
  open,
  onClose,
}: AtlasPanelSettingsModalProps) {
  const dispatch = useAppDispatch();
  const atlasPanel = useAppSelector((state) => state.visualizationUi.atlasPanel);
  const atlasDefinition = useActiveAtlasDefinition();

  const availableGroupFields = useMemo(
    () => getCommonRoiFields(atlasDefinition),
    [atlasDefinition],
  );

  const selectableGroupFields = useMemo(
    () =>
      availableGroupFields.filter(
        (field) => !atlasPanel.groupByFields.includes(field),
      ),
    [atlasPanel.groupByFields, availableGroupFields],
  );

  const supports3d = useMemo(
    () => atlasSupports3d(atlasDefinition),
    [atlasDefinition],
  );

  const handleMoveGroupField = useCallback(
    (field: string, direction: "up" | "down") => {
      dispatch(
        setAtlasPanelState({
          groupByFields: moveField(atlasPanel.groupByFields, field, direction),
          collapsedGroups: [],
        }),
      );
    },
    [atlasPanel.groupByFields, dispatch],
  );

  const handleRemoveGroupField = useCallback(
    (field: string) => {
      const nextSelectedFilters = { ...atlasPanel.selectedFilters };
      delete nextSelectedFilters[field];

      dispatch(
        setAtlasPanelState({
          groupByFields: atlasPanel.groupByFields.filter((value) => value !== field),
          selectedFilters: nextSelectedFilters,
          collapsedGroups: [],
        }),
      );
    },
    [atlasPanel.groupByFields, atlasPanel.selectedFilters, dispatch],
  );

  const handleAddGroupField = useCallback(
    (field: string) => {
      dispatch(
        setAtlasPanelState({
          groupByFields: [...atlasPanel.groupByFields, field],
          collapsedGroups: [],
        }),
      );
    },
    [atlasPanel.groupByFields, dispatch],
  );

  const handleApplySuggestedGroupFields = useCallback(() => {
    dispatch(
      setAtlasPanelState({
        groupByFields: getDefaultGroupByFields(availableGroupFields),
        selectedFilters: {},
        collapsedGroups: [],
      }),
    );
  }, [availableGroupFields, dispatch]);

  const handle3dAvailabilityChange = useCallback(
    (is3dAvailable: boolean) => {
      dispatch(setAtlasPanelState({ is3dAvailable }));
    },
    [dispatch],
  );

  const hasGroupByFields = atlasPanel.groupByFields.length > 0;
  const hasSelectableGroupFields = selectableGroupFields.length > 0;
  const canApplySuggestedFields =
    getDefaultGroupByFields(availableGroupFields).length > 0;

  return (
    <Modal
      title="Atlas settings"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
    >
      <Space direction="vertical" size={18} className="atlas-panel__settings-stack">
        <Space direction="vertical" size={8} className="atlas-panel__settings-stack">
          <Typography.Text strong>Grouping fields</Typography.Text>

          {hasGroupByFields ? (
            <Space direction="vertical" size={8} className="atlas-panel__settings-stack">
              {atlasPanel.groupByFields.map((field, index) => (
                <div key={field} className="atlas-panel__field-row">
                  <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
                  <Space>
                    <Button
                      size="small"
                      icon={<ArrowUpOutlined />}
                      onClick={() => handleMoveGroupField(field, "up")}
                      disabled={index === 0}
                      aria-label={`Move ${humanizeFieldName(field)} up`}
                    />
                    <Button
                      size="small"
                      icon={<ArrowDownOutlined />}
                      onClick={() => handleMoveGroupField(field, "down")}
                      disabled={index === atlasPanel.groupByFields.length - 1}
                      aria-label={`Move ${humanizeFieldName(field)} down`}
                    />
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveGroupField(field)}
                      aria-label={`Remove ${humanizeFieldName(field)}`}
                    />
                  </Space>
                </div>
              ))}
            </Space>
          ) : (
            <Alert
              type="info"
              showIcon
              message="No grouping fields selected"
              description="ROIs are shown without categorical grouping."
              action={
                canApplySuggestedFields ? (
                  <Button size="small" onClick={handleApplySuggestedGroupFields}>
                    Use suggested fields
                  </Button>
                ) : undefined
              }
            />
          )}

          {hasSelectableGroupFields ? (
            <Select
              key={atlasPanel.groupByFields.join("|")}
              placeholder="Select field"
              className="atlas-panel__settings-select"
              options={selectableGroupFields.map((field) => ({
                value: field,
                label: humanizeFieldName(field),
              }))}
              onChange={(value) => handleAddGroupField(String(value))}
              value={null}
            />
          ) : null}
        </Space>

        <Space direction="vertical" size={8} className="atlas-panel__settings-stack">
          <Typography.Text strong>3D view</Typography.Text>
          <div className="atlas-panel__field-row">
            <Space direction="vertical" size={2}>
              <Typography.Text>Available for this atlas</Typography.Text>
              <Typography.Text type="secondary">
                {supports3d
                  ? "Valid mesh points were found."
                  : "No valid mesh points are available with the current mode."}
              </Typography.Text>
            </Space>
            <Switch
              checked={atlasPanel.is3dAvailable && supports3d}
              disabled={!supports3d}
              onChange={handle3dAvailabilityChange}
            />
          </div>
        </Space>
      </Space>
    </Modal>
  );
}
