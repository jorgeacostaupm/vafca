import { Divider } from "antd";
import PopulationCatalogSection from "@/components/management/components/catalogs/PopulationCatalogSection";
import MeasureCatalogSection from "@/components/management/components/catalogs/MeasureCatalogSection";
import StatCatalogSection from "@/components/management/components/catalogs/StatCatalogSection";
import LayerCatalogSection from "@/components/management/components/catalogs/LayerCatalogSection";

function CatalogManagementSections() {
  return (
    <>
      <Divider style={{ margin: "8px 0" }} />
      <PopulationCatalogSection />
      <MeasureCatalogSection />
      <StatCatalogSection />
      <LayerCatalogSection />
    </>
  );
}

export default CatalogManagementSections;
