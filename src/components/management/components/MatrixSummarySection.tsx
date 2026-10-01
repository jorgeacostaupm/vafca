import { Typography } from "antd";

import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import {
  getDatasetCatalogs,
  getDatasetNetworkStats,
} from "@/utils/datasetAccessors";
import { formatSourceLabel } from "@/utils/matrixViewUtils";

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
        {Object.entries(networkStats.byMeasureStatisticSource).map(([measureId, statMap]) => (
          <Typography.Text key={measureId} type="secondary">
            {(catalogs.measures[measureId]?.label ?? measureId) + ": "}
            {Object.entries(statMap)
              .map(([statisticId, sourceMap]) => {
                const total = Object.values(sourceMap).reduce(
                  (acc, value) => acc + value,
                  0,
                );
                const perSourceSet = Object.entries(sourceMap)
                  .map(([sourceId, count]) => {
                    const label = formatSourceLabel(sourceId, catalogs);
                    return `${label} ${count}`;
                  })
                  .join(", ");
                return `${catalogs.statistics[statisticId]?.label ?? statisticId} ${total} (${perSourceSet})`;
              })
              .join(" · ")}
          </Typography.Text>
        ))}
      </div>
    </div>
  );
}

export default MatrixSummarySection;
