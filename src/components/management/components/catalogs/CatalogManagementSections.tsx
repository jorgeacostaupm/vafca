import { Tabs } from "antd";
import { DEFAULT_CATALOG_MANAGEMENT_TAB } from "@/config/ui";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";
import PopulationCatalogSection from "@/components/management/components/catalogs/PopulationCatalogSection";
import MeasureCatalogSection from "@/components/management/components/catalogs/MeasureCatalogSection";
import StatCatalogSection from "@/components/management/components/catalogs/StatCatalogSection";
import LayerCatalogSection from "@/components/management/components/catalogs/LayerCatalogSection";
import { classifyStatCatalogItem } from "@/components/management/components/catalogs/statCatalogGroups";

function CatalogManagementSections() {
  const stats = useAppSelector(
    (state) => selectDatasetContent(state)?.catalogs.stats ?? {},
  );
  const matrices = useAppSelector(
    (state) => selectDatasetContent(state)?.matrices ?? [],
  );
  const statItems = Object.values(stats);
  const matrixStats = statItems.filter(
    (stat) => classifyStatCatalogItem(stat, matrices) === "matrix",
  );
  const comparisonStats = statItems.filter(
    (stat) => classifyStatCatalogItem(stat, matrices) === "comparison",
  );

  const items = [
    {
      key: "populations",
      label: "Populations",
      children: <PopulationCatalogSection />,
    },
    {
      key: "measures",
      label: "Measures",
      children: <MeasureCatalogSection />,
    },
    {
      key: "matrix-stats",
      label: "Matrix statistics",
      children: (
        <StatCatalogSection
          title="Matrix statistics"
          stats={matrixStats}
          emptyMessage="No matrix statistics available."
        />
      ),
    },
    {
      key: "comparison-stats",
      label: "Comparison statistics",
      children: (
        <StatCatalogSection
          title="Comparison statistics"
          stats={comparisonStats}
          emptyMessage="No comparison statistics available."
        />
      ),
    },
    {
      key: "layers",
      label: "Layers",
      children: <LayerCatalogSection />,
    },
  ];

  return (
    <Tabs defaultActiveKey={DEFAULT_CATALOG_MANAGEMENT_TAB} items={items} />
  );
}

export default CatalogManagementSections;
