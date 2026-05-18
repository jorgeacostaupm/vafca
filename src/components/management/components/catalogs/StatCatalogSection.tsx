import { Card, Divider, Input, Space, Switch, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";
import { isEnabled } from "@/components/management/utils/catalogValues";
import { useCatalogItemUpdater } from "@/components/management/components/catalogs/useCatalogItemUpdater";

function StatCatalogSection() {
  const updateItem = useCatalogItemUpdater();
  const stats = useAppSelector(
    (state) => state.dataset.data?.catalogs.stats ?? {},
  );

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
