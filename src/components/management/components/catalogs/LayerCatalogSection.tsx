import { Card, Input, Space, Switch } from "antd";

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
    <div className="catalog-management-section">
      <div className="catalog-management-grid">
        {Object.values(layers).map((layer) => (
          <Card key={layer.id} size="small" className="catalog-management-card">
            <Space direction="vertical" size={8} className="catalog-management-card__body">
              <Space wrap size={12} align="start">
                <Input
                  size="small"
                  placeholder="Layer label"
                  value={layer.label ?? ""}
                  className="catalog-management-label-input"
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
                className="catalog-management-description"
              />
            </Space>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default LayerCatalogSection;
