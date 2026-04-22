import { Card, Divider, Input, InputNumber, Space, Switch, Typography } from "antd";
import type { ConnectivityCatalogs } from "@/types/catalogs";
import type { UpdateCatalogItemHandler } from "@/components/management/types";
import {
  isEnabled,
  normalizeNumber,
} from "@/components/management/utils/catalogValues";

type MeasureCatalogSectionProps = {
  measures: ConnectivityCatalogs["measures"];
  onUpdateItem: UpdateCatalogItemHandler;
};

function MeasureCatalogSection({
  measures,
  onUpdateItem,
}: MeasureCatalogSectionProps) {
  return (
    <>
      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Measures</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(measures).map((measure) => (
            <Card key={measure.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Measure label"
                    value={measure.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      onUpdateItem("measures", measure.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(measure)}
                    onChange={(checked) =>
                      onUpdateItem("measures", measure.id, {
                        enabled: checked,
                      })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Min"
                    value={measure.min ?? null}
                    onChange={(value) =>
                      onUpdateItem("measures", measure.id, {
                        min: normalizeNumber(value),
                      })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Max"
                    value={measure.max ?? null}
                    onChange={(value) =>
                      onUpdateItem("measures", measure.id, {
                        max: normalizeNumber(value),
                      })
                    }
                  />
                  <Typography.Text type="secondary">ID: {measure.id}</Typography.Text>
                </Space>

                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={measure.description ?? ""}
                  onChange={(event) =>
                    onUpdateItem("measures", measure.id, {
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

export default MeasureCatalogSection;
