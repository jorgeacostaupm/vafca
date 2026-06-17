import { Typography } from "antd";

import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  getDatasetCatalogs,
  getDatasetNetworkStats,
} from "@/utils/datasetAccessors";
import { formatPopulationSetLabel } from "@/utils/matrixViewUtils";

function MatrixSummarySection() {
  const data = useAppSelector((state) => selectDatasetData(state));

  if (!data) return null;
  const catalogs = getDatasetCatalogs(data);
  const networkStats = getDatasetNetworkStats(data);
  if (!catalogs) return null;

  return (
    <div className="data-management-matrix-summary">
      <Typography.Text strong>Matrix summary</Typography.Text>
      <div className="data-management-matrix-summary__list">
        {Object.entries(networkStats.byMeasureStatPopulationSet).map(([measureId, statMap]) => (
          <Typography.Text key={measureId} type="secondary">
            {(catalogs.measures[measureId]?.label ?? measureId) + ": "}
            {Object.entries(statMap)
              .map(([statId, popMap]) => {
                const total = Object.values(popMap).reduce(
                  (acc, value) => acc + value,
                  0,
                );
                const perPopulationSet = Object.entries(popMap)
                  .map(([populationKey, count]) => {
                    const label = formatPopulationSetLabel(
                      populationKey.split("+"),
                      catalogs,
                    );
                    return `${label} ${count}`;
                  })
                  .join(", ");
                return `${catalogs.statistics[statId]?.label ?? statId} ${total} (${perPopulationSet})`;
              })
              .join(" · ")}
          </Typography.Text>
        ))}
      </div>
    </div>
  );
}

export default MatrixSummarySection;
