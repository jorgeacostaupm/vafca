import { Card, Divider, Input, InputNumber, Space, Switch, Typography } from "antd";
import type { ConnectivityCatalogs } from "@/types/catalogs";
import type { UpdateCatalogItemHandler } from "@/components/management/types";
import {
  isEnabled,
  normalizeNumber,
} from "@/components/management/utils/catalogValues";

type StatCatalogSectionProps = {
  stats: ConnectivityCatalogs["stats"];
  onUpdateItem: UpdateCatalogItemHandler;
};

function StatCatalogSection({ stats, onUpdateItem }: StatCatalogSectionProps) {
  return (
    <>
      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Statistics</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(stats).map((stat) => (
            <Card key={stat.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={8} align="start">
                  <Input
                    size="small"
                    placeholder="Statistic label"
                    value={stat.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      onUpdateItem("stats", stat.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(stat)}
                    onChange={(checked) =>
                      onUpdateItem("stats", stat.id, {
                        enabled: checked,
                      })
                    }
                  />
                  <Space size={4}>
                    <Switch
                      checked={stat.useDataRange === true}
                      onChange={(checked) =>
                        onUpdateItem("stats", stat.id, {
                          useDataRange: checked,
                        })
                      }
                    />
                    <Typography.Text type="secondary">Use data range</Typography.Text>
                  </Space>
                  <InputNumber
                    size="small"
                    placeholder="Min"
                    value={stat.min ?? null}
                    onChange={(value) =>
                      onUpdateItem("stats", stat.id, {
                        min: normalizeNumber(value),
                      })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Max"
                    value={stat.max ?? null}
                    onChange={(value) =>
                      onUpdateItem("stats", stat.id, {
                        max: normalizeNumber(value),
                      })
                    }
                  />
                  <Typography.Text type="secondary">ID: {stat.id}</Typography.Text>
                </Space>

                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={stat.description ?? ""}
                  onChange={(event) =>
                    onUpdateItem("stats", stat.id, {
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

export default StatCatalogSection;
