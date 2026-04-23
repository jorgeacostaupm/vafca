import { Card, Divider, Input, Space, Switch, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";
import { isEnabled } from "@/components/management/utils/catalogValues";
import { useCatalogItemUpdater } from "@/components/management/components/catalogs/useCatalogItemUpdater";

function BandCatalogSection() {
  const updateItem = useCatalogItemUpdater();
  const bands = useAppSelector(
    (state) => state.dataset.data?.catalogs.bands ?? {},
  );

  return (
    <>
      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Bands</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(bands).map((band) => (
            <Card key={band.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Band label"
                    value={band.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      updateItem("bands", band.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(band)}
                    onChange={(checked) =>
                      updateItem("bands", band.id, {
                        enabled: checked,
                      })
                    }
                  />
                  <Typography.Text type="secondary">
                    Frequency range: {band.min}-{band.max} Hz
                  </Typography.Text>
                  <Typography.Text type="secondary">ID: {band.id}</Typography.Text>
                </Space>

                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={band.description ?? ""}
                  onChange={(event) =>
                    updateItem("bands", band.id, {
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

export default BandCatalogSection;
