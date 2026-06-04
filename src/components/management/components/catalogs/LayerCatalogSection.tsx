import { Card, Divider, Input, Space, Switch, Typography } from "antd";

import { useCatalogItemUpdater } from "@/components/management/components/catalogs/useCatalogItemUpdater";
import { isEnabled } from "@/components/management/utils/catalogValues";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";

function LayerCatalogSection() {
  const updateItem = useCatalogItemUpdater();
  const layers = useAppSelector(
    (state) => selectDatasetContent(state)?.catalogs.layers ?? {},
  );

  return (
    <>
      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Layers</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(layers).map((layer) => (
            <Card key={layer.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Layer label"
                    value={layer.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      updateItem("layers", layer.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(layer)}
                    onChange={(checked) =>
                      updateItem("layers", layer.id, {
                        enabled: checked,
                      })
                    }
                  />
                </Space>

                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={layer.description ?? ""}
                  onChange={(event) =>
                    updateItem("layers", layer.id, {
                      description: event.target.value,
                    })
                  }
                  style={{ resize: "vertical" }}
                />
              </Space>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

export default LayerCatalogSection;
