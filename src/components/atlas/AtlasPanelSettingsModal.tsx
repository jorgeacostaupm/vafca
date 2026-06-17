import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { Button, Modal, Select, Space, Switch, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";

import SettingsSection from "@/components/network/settings/SettingsSection";
import {
  DEFAULT_ATLAS_MODAL_TOP,
  DEFAULT_ATLAS_SETTINGS_MODAL_WIDTH,
} from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import {
  getCommonNodeFields,
  humanizeFieldName,
} from "@/utils/atlas/atlasDefinition";

import { useActiveAtlasDefinition } from "./hooks/useActiveAtlasDefinition";
import {
  areStringArraysEqual,
  moveField,
  normalizeUniqueFieldList,
} from "./panelFieldUtils";

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
  const [draftGroupByFields, setDraftGroupByFields] = useState<string[]>(
    atlasPanel.groupByFields,
  );

  const availableGroupFields = useMemo(
    () => getCommonNodeFields(atlasDefinition),
    [atlasDefinition],
  );

  const selectableGroupFields = useMemo(
    () =>
      availableGroupFields.filter(
        (field) => !draftGroupByFields.includes(field),
      ),
    [draftGroupByFields, availableGroupFields],
  );

  const normalizedDraftGroupByFields = useMemo(
    () => normalizeUniqueFieldList(draftGroupByFields, availableGroupFields),
    [availableGroupFields, draftGroupByFields],
  );

  const handleModalOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) return;
      setDraftGroupByFields(
        normalizeUniqueFieldList(atlasPanel.groupByFields, availableGroupFields),
      );
    },
    [atlasPanel.groupByFields, availableGroupFields],
  );

  const handleMoveGroupField = useCallback(
    (field: string, direction: "up" | "down") => {
      setDraftGroupByFields((fields) => moveField(fields, field, direction));
    },
    [],
  );

  const handleRemoveGroupField = useCallback(
    (field: string) => {
      setDraftGroupByFields((fields) =>
        fields.filter((value) => value !== field),
      );
    },
    [],
  );

  const handleAddGroupField = useCallback(
    (field: string) => {
      setDraftGroupByFields((fields) =>
        fields.includes(field) ? fields : [...fields, field],
      );
    },
    [],
  );

  const handleApplyGroupFields = useCallback(() => {
    const nextSelectedFilters = Object.fromEntries(
      Object.entries(atlasPanel.selectedFilters).filter(([field]) =>
        normalizedDraftGroupByFields.includes(field),
      ),
    );

    dispatch(
      setAtlasPanelState({
        groupByFields: normalizedDraftGroupByFields,
        groupByFieldsInitialized: true,
        selectedFilters: nextSelectedFilters,
        collapsedGroups: [],
      }),
    );
    setDraftGroupByFields(normalizedDraftGroupByFields);
  }, [atlasPanel.selectedFilters, dispatch, normalizedDraftGroupByFields]);

  const hasPendingGroupFieldChanges = useMemo(
    () =>
      !areStringArraysEqual(
        normalizedDraftGroupByFields,
        atlasPanel.groupByFields,
      ),
    [atlasPanel.groupByFields, normalizedDraftGroupByFields],
  );

  const handle3dAvailabilityChange = useCallback(
    (is3dAvailable: boolean) => {
      dispatch(setAtlasPanelState({ is3dAvailable }));
    },
    [dispatch],
  );

  const hasGroupByFields = draftGroupByFields.length > 0;
  const hasSelectableGroupFields = selectableGroupFields.length > 0;

  return (
    <Modal
      title="Atlas settings"
      open={open}
      onCancel={onClose}
      afterOpenChange={handleModalOpenChange}
      footer={null}
      width={DEFAULT_ATLAS_SETTINGS_MODAL_WIDTH}
      style={{ top: DEFAULT_ATLAS_MODAL_TOP }}
      className="network-settings-modal atlas-panel__settings-modal"
    >
      <Space direction="vertical" size={18} className="atlas-panel__settings-stack">
        <SettingsSection
          title="Grouping fields"
          description="Choose the atlas fields used to group and filter nodes."
        >
          {hasGroupByFields ? (
            <Space direction="vertical" size={8} className="atlas-panel__settings-stack">
              {draftGroupByFields.map((field, index) => (
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
                      disabled={index === draftGroupByFields.length - 1}
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
          ) : null}

          {hasSelectableGroupFields ? (
            <Select
              key={draftGroupByFields.join("|")}
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

          <div className="atlas-panel__settings-actions">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleApplyGroupFields}
              disabled={!hasPendingGroupFieldChanges}
            >
              Apply
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          title="3D view"
          description="Control whether the atlas mesh viewer is available in the Atlas tab."
          actions={
            <Switch
              checked={atlasPanel.is3dAvailable}
              onChange={handle3dAvailabilityChange}
            />
          }
        />
      </Space>
    </Modal>
  );
}
