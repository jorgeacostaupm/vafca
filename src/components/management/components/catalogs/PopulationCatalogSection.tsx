import { Card, Input, Space, Switch, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";
import { isEnabled } from "@/components/management/utils/catalogValues";
import { useCatalogItemUpdater } from "@/components/management/components/catalogs/useCatalogItemUpdater";

function PopulationCatalogSection() {
  const updateItem = useCatalogItemUpdater();
  const populations = useAppSelector(
    (state) => state.dataset.data?.catalogs.populations ?? {},
  );

  return (
    <div>
      <Typography.Text strong>Populations</Typography.Text>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {Object.values(populations).map((population) => (
          <Card key={population.id} size="small" style={{ width: 300 }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space wrap size={12} align="start">
                <Input
                  size="small"
                  placeholder="Population label"
                  value={population.label ?? ""}
                  style={{ width: 160 }}
                  onChange={(event) =>
                    updateItem("populations", population.id, {
                      label: event.target.value,
                    })
                  }
                />
                <Switch
                  checked={isEnabled(population)}
                  onChange={(checked) =>
                    updateItem("populations", population.id, {
                      enabled: checked,
                    })
                  }
                />
                <Typography.Text type="secondary">ID: {population.id}</Typography.Text>
              </Space>

              <Input.TextArea
                size="small"
                placeholder="Description"
                value={population.description ?? ""}
                onChange={(event) =>
                  updateItem("populations", population.id, {
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
  );
}

export default PopulationCatalogSection;
