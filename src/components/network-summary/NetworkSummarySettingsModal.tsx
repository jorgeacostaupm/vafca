import { Button, Checkbox, Form, InputNumber, Modal, Space, Typography } from "antd";

import {
  DEFAULT_NETWORK_SUMMARY_SETTINGS_MODAL_WIDTH,
  NETWORK_SUMMARY_FIELD_GROUPS,
  NETWORK_SUMMARY_TOP_ITEMS_LIMIT_OPTIONS,
} from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  patchNetworkSummarySettings,
  resetNetworkSummarySettings,
  selectNetworkSummarySettings,
  setNetworkSummaryFieldVisibility,
} from "@/store/slices/networkMeasures";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NetworkSummarySettingsModal({ open, onClose }: Props) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectNetworkSummarySettings);

  return (
    <Modal
      title="Summary settings"
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key="reset"
          onClick={() => dispatch(resetNetworkSummarySettings())}
        >
          Reset
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Done
        </Button>,
      ]}
      width={DEFAULT_NETWORK_SUMMARY_SETTINGS_MODAL_WIDTH}
    >
      <Form layout="vertical" className="network-summary-settings">
        <div className="network-summary-settings__options">
          <Form.Item label="Link handling">
            <Space direction="vertical" size={4}>
              <Checkbox
                checked={settings.includeDiagonal}
                onChange={(event) =>
                  dispatch(
                    patchNetworkSummarySettings({
                      includeDiagonal: event.target.checked,
                    }),
                  )
                }
              >
                Include diagonal values
              </Checkbox>
              <Checkbox
                checked={settings.includeZeroEdges}
                onChange={(event) =>
                  dispatch(
                    patchNetworkSummarySettings({
                      includeZeroEdges: event.target.checked,
                    }),
                  )
                }
              >
                Count zero values as links
              </Checkbox>
            </Space>
          </Form.Item>

          <Form.Item label="Top table rows">
            <InputNumber
              min={Math.min(...NETWORK_SUMMARY_TOP_ITEMS_LIMIT_OPTIONS)}
              max={Math.max(...NETWORK_SUMMARY_TOP_ITEMS_LIMIT_OPTIONS)}
              value={settings.topItemsLimit}
              onChange={(value) =>
                dispatch(
                  patchNetworkSummarySettings({
                    topItemsLimit: Number(value) || settings.topItemsLimit,
                  }),
                )
              }
            />
          </Form.Item>
        </div>

        <div className="network-summary-settings__visibility-header">
          <Typography.Text strong>Field</Typography.Text>
          <Typography.Text strong>Summary tab</Typography.Text>
          <Typography.Text strong>View summaries</Typography.Text>
        </div>

        {NETWORK_SUMMARY_FIELD_GROUPS.map((group) => (
          <div className="network-summary-settings__group" key={group.key}>
            <Typography.Text strong>{group.label}</Typography.Text>
            {group.fields.map((field) => {
              const visibility = settings.visibleFields[field.id];
              return (
                <div className="network-summary-settings__field" key={field.id}>
                  <Typography.Text>{field.label}</Typography.Text>
                  <Checkbox
                    checked={visibility?.summaryTab ?? false}
                    onChange={(event) =>
                      dispatch(
                        setNetworkSummaryFieldVisibility({
                          fieldId: field.id,
                          target: "summaryTab",
                          visible: event.target.checked,
                        }),
                      )
                    }
                    aria-label={`${field.label} in Summary tab`}
                  />
                  <Checkbox
                    checked={visibility?.viewSummaries ?? false}
                    onChange={(event) =>
                      dispatch(
                        setNetworkSummaryFieldVisibility({
                          fieldId: field.id,
                          target: "viewSummaries",
                          visible: event.target.checked,
                        }),
                      )
                    }
                    aria-label={`${field.label} in View summaries`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </Form>
    </Modal>
  );
}
