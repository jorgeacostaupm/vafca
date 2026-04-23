import { Button, Select, Spin, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useAppDispatch } from "@/store/hooks";
import {
  markNetworkViewFormatting,
  mutateNetworkViewType,
} from "@/store/slices/networkVisualization";
import type { ViewTypeSelectProps } from "@/types/networkPanels";
import type { NetworkViewType } from "@/types/networkVisualization";

export const LoadingPanelBody = ({ text }: { text: string }) => (
  <div
    style={{
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Spin tip={text} />
  </div>
);

export const StatusContent = ({
  status,
  error,
  onRetry,
}: {
  status: "formatting" | "ready" | "error";
  error?: string;
  onRetry: () => void;
}) => {
  if (status === "error") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <Typography.Text type="danger">
          {error ?? "Failed to build view."}
        </Typography.Text>
        <Button size="small" onClick={onRetry} style={{ justifySelf: "start" }}>
          Retry
        </Button>
      </div>
    );
  }
  return <LoadingPanelBody text="Formatting view…" />;
};

export const NetworkPanelStatusContent = ({
  viewId,
  status,
  error,
}: {
  viewId: string;
  status: "formatting" | "ready" | "error";
  error?: string;
}) => {
  const dispatch = useAppDispatch();

  return (
    <StatusContent
      status={status}
      error={error}
      onRetry={() => dispatch(markNetworkViewFormatting({ viewId }))}
    />
  );
};

export const ViewTypeSelect = ({ value, onChange }: ViewTypeSelectProps) => (
  <Select
    size="small"
    style={{ width: 128 }}
    aria-label="Mutate view type"
    value={value}
    onChange={(nextValue) =>
      onChange(nextValue as "matrix" | "circular" | "classic")
    }
    options={[
      { value: "matrix", label: "Matrix" },
      { value: "circular", label: "Circular" },
      { value: "classic", label: "Node-Link" },
    ]}
  />
);

export const NetworkViewTypeControl = ({
  viewId,
  value,
}: {
  viewId: string;
  value: NetworkViewType;
}) => {
  const dispatch = useAppDispatch();

  return (
    <ViewTypeSelect
      value={value}
      onChange={(nextType) =>
        dispatch(
          mutateNetworkViewType({
            viewId,
            nextType,
          }),
        )
      }
    />
  );
};

export const NetworkPanelReloadButton = ({ viewId }: { viewId: string }) => {
  const dispatch = useAppDispatch();

  return (
    <Button
      size="small"
      type="text"
      aria-label="Reload view"
      icon={<ReloadOutlined />}
      onClick={() => dispatch(markNetworkViewFormatting({ viewId }))}
    />
  );
};
