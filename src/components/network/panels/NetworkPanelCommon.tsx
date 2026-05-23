import { Button, Spin, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useAppDispatch } from "@/store/hooks";
import { markNetworkViewFormatting } from "@/store/slices/networkVisualization";

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
