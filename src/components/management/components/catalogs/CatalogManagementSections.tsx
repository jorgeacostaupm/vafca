import { Divider } from "antd";
import PopulationCatalogSection from "@/components/management/components/catalogs/PopulationCatalogSection";
import MeasureCatalogSection from "@/components/management/components/catalogs/MeasureCatalogSection";
import StatCatalogSection from "@/components/management/components/catalogs/StatCatalogSection";
import BandCatalogSection from "@/components/management/components/catalogs/BandCatalogSection";

function CatalogManagementSections() {
  return (
    <>
      <Divider style={{ margin: "8px 0" }} />
      <PopulationCatalogSection />
      <MeasureCatalogSection />
      <StatCatalogSection />
      <BandCatalogSection />
    </>
  );
}

export default CatalogManagementSections;
