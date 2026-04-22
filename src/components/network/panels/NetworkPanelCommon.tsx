import { Button, Select, Spin, Typography } from "antd";
import type { ViewTypeSelectProps } from "@/types/networkPanels";

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
