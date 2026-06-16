import { Tabs } from "antd";
import { useMemo } from "react";

import LayerCatalogSection from "@/components/management/components/catalogs/LayerCatalogSection";
import MeasureCatalogSection from "@/components/management/components/catalogs/MeasureCatalogSection";
import PopulationCatalogSection from "@/components/management/components/catalogs/PopulationCatalogSection";
import {
  buildStatUsageById,
  classifyStatCatalogItemWithUsage,
} from "@/components/management/components/catalogs/statCatalogGroups";
import StatCatalogSection from "@/components/management/components/catalogs/StatCatalogSection";
import { DEFAULT_CATALOG_MANAGEMENT_TAB } from "@/config/ui";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";

function CatalogManagementSections() {
  const stats = useAppSelector(
    (state) => selectDatasetContent(state)?.catalogs.statistics ?? {},
  );
  const networks = useAppSelector(
    (state) => selectDatasetContent(state)?.networks ?? [],
  );
  const statUsageById = useMemo(() => buildStatUsageById(networks), [networks]);
  const { networkStats, comparisonStats } = useMemo(
    () =>
      Object.values(stats).reduce(
        (groups, stat) => {
          const group = classifyStatCatalogItemWithUsage(
            stat,
            statUsageById[stat.id],
          );
          if (group === "comparison") {
            groups.comparisonStats.push(stat);
          } else {
            groups.networkStats.push(stat);
          }
          return groups;
        },
        {
          networkStats: [] as typeof stats[keyof typeof stats][],
          comparisonStats: [] as typeof stats[keyof typeof stats][],
        },
      ),
    [statUsageById, stats],
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
          stats={networkStats}
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
