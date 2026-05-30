import { Card, Divider, Input, Space, Switch, Typography } from "antd";
import type { StatCatalogEntry } from "@/types/connectivityBundle";
import { isEnabled } from "@/components/management/utils/catalogValues";
import { useCatalogItemUpdater } from "@/components/management/components/catalogs/useCatalogItemUpdater";

type StatCatalogSectionProps = {
  title: string;
  stats: Array<StatCatalogEntry & { description?: string | null; enabled?: boolean }>;
  emptyMessage: string;
};

function StatCatalogSection({ title, stats, emptyMessage }: StatCatalogSectionProps) {
  const updateItem = useCatalogItemUpdater();

  return (
    <>
      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>{title}</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {stats.length === 0 ? (
            <Typography.Text type="secondary">{emptyMessage}</Typography.Text>
          ) : null}
          {stats.map((stat) => (
            <Card key={stat.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={8} align="start">
                  <Input
                    size="small"
                    placeholder="Statistic label"
                    value={stat.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      updateItem("stats", stat.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(stat)}
                    onChange={(checked) =>
                      updateItem("stats", stat.id, {
                        enabled: checked,
                      })
                    }
                  />
                </Space>

                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={stat.description ?? ""}
                  onChange={(event) =>
                    updateItem("stats", stat.id, {
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
