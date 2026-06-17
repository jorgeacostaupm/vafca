import { ReloadOutlined } from "@ant-design/icons";
import { Button, Spin, Typography } from "antd";

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

export const NetworkViewStatusContent = ({
  viewId,
  status,
  error,
}: {
  viewId: string;
  status: "formatting" | "ready" | "error";
  error?: string;
}) => {
  const dispatch = useAppDispatch();

  if (status === "error") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <Typography.Text type="danger">
          {error ?? "Failed to build view."}
        </Typography.Text>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          onClick={() => dispatch(markNetworkViewFormatting({ viewId }))}
          style={{ justifySelf: "start" }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return <LoadingPanelBody text="Formatting view…" />;
};

export const NetworkViewReloadButton = ({
  viewId,
}: {
  viewId: string;
}) => {
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
