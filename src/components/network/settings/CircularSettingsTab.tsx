import { Form, Slider, Space, Switch, Typography } from "antd";
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/types/circular";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectNetworkControls,
  setNetworkCircularBundlingEnabled,
  setNetworkCircularLinkTension,
} from "@/store/slices/networkVisualization";
import HierarchySettingsTab from "./HierarchySettingsTab";

const TENSION_MARKS = {
  0: "0",
  0.5: "0.5",
  1: "1",
};

const normalizeTension = (value: number | [number, number]) =>
  Array.isArray(value) ? value[0] : value;

export default function CircularSettingsTab() {
  const dispatch = useAppDispatch();
  const controls = useAppSelector(selectNetworkControls);
  const tension = controls.circularLinkTension ?? DEFAULT_CIRCULAR_LINK_TENSION;
  const bundlingEnabled =
    controls.circularBundlingEnabled ?? DEFAULT_CIRCULAR_BUNDLING_ENABLED;

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <Form layout="vertical" style={{ marginBottom: 0 }}>
        <Form.Item label="Hierarchical edge bundling">
          <Switch
            checked={bundlingEnabled}
            onChange={(value) =>
              dispatch(
                setNetworkCircularBundlingEnabled({
                  value,
                }),
              )
            }
          />
        </Form.Item>
        <Form.Item
          label={
            <Space size={8}>
              <Typography.Text>Link tension</Typography.Text>
              <Typography.Text type="secondary">{tension.toFixed(2)}</Typography.Text>
            </Space>
          }
          style={{ marginBottom: 0 }}
        >
          <Slider
            min={0}
            max={1}
            step={0.05}
            marks={TENSION_MARKS}
            value={tension}
            disabled={!bundlingEnabled}
            onChange={(value) =>
              dispatch(
                setNetworkCircularLinkTension({
                  value: normalizeTension(value),
                }),
              )
            }
          />
        </Form.Item>
      </Form>

      <HierarchySettingsTab
        mode="circular"
        circularLinkTension={tension}
        circularBundlingEnabled={bundlingEnabled}
      />
    </Space>
  );
}
