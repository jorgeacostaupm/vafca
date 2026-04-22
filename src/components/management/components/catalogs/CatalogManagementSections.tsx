import { Divider } from "antd";
import type { ConnectivityCatalogs } from "@/types/catalogs";
import type { UpdateCatalogItemHandler } from "@/components/management/types";
import PopulationCatalogSection from "@/components/management/components/catalogs/PopulationCatalogSection";
import MeasureCatalogSection from "@/components/management/components/catalogs/MeasureCatalogSection";
import StatCatalogSection from "@/components/management/components/catalogs/StatCatalogSection";
import BandCatalogSection from "@/components/management/components/catalogs/BandCatalogSection";

type CatalogManagementSectionsProps = {
  catalogs: ConnectivityCatalogs;
  onUpdateItem: UpdateCatalogItemHandler;
};

function CatalogManagementSections({
  catalogs,
  onUpdateItem,
}: CatalogManagementSectionsProps) {
  return (
    <>
      <Divider style={{ margin: "8px 0" }} />
      <PopulationCatalogSection
        populations={catalogs.populations}
        onUpdateItem={onUpdateItem}
      />
      <MeasureCatalogSection measures={catalogs.measures} onUpdateItem={onUpdateItem} />
      <StatCatalogSection stats={catalogs.stats} onUpdateItem={onUpdateItem} />
      <BandCatalogSection bands={catalogs.bands} onUpdateItem={onUpdateItem} />
    </>
  );
}

export default CatalogManagementSections;
