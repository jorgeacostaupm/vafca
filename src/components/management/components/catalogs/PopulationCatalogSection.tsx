import { Card, Input, Space, Switch, Typography } from "antd";
import type { ConnectivityCatalogs } from "@/types/catalogs";
import type { UpdateCatalogItemHandler } from "@/components/management/types";
import { isEnabled } from "@/components/management/utils/catalogValues";

type PopulationCatalogSectionProps = {
  populations: ConnectivityCatalogs["populations"];
  onUpdateItem: UpdateCatalogItemHandler;
};

function PopulationCatalogSection({
  populations,
  onUpdateItem,
}: PopulationCatalogSectionProps) {
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
                    onUpdateItem("populations", population.id, {
                      label: event.target.value,
                    })
                  }
                />
                <Switch
                  checked={isEnabled(population)}
                  onChange={(checked) =>
                    onUpdateItem("populations", population.id, {
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
                  onUpdateItem("populations", population.id, {
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
