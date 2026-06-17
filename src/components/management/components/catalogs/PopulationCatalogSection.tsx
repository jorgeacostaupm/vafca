import { Card, Input, Space, Switch } from "antd";

import { useCatalogItemUpdater } from "@/components/management/components/catalogs/useCatalogItemUpdater";
import { isEnabled } from "@/components/management/utils/catalogValues";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";

function PopulationCatalogSection() {
  const updateItem = useCatalogItemUpdater();
  const populations = useAppSelector(
    (state) => selectDatasetContent(state)?.catalogs.populations ?? {},
  );

  return (
    <div className="catalog-management-section">
      <div className="catalog-management-grid">
        {Object.values(populations).map((population) => (
          <Card key={population.id} size="small" className="catalog-management-card">
            <Space direction="vertical" size={8} className="catalog-management-card__body">
              <Space wrap size={12} align="start">
                <Input
                  size="small"
                  placeholder="Population label"
                  value={population.label ?? ""}
                  className="catalog-management-label-input"
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
                className="catalog-management-description"
              />
            </Space>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PopulationCatalogSection;
