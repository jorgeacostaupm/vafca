import { Space, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { formatPopulationSetLabel } from "@/utils/matrixViewUtils";
import {
  getDatasetCatalogs,
  getDatasetMatrixStats,
} from "@/utils/datasetAccessors";

function MatrixSummarySection() {
  const data = useAppSelector((state) => selectDatasetData(state));

  if (!data) return null;
  const catalogs = getDatasetCatalogs(data);
  const matrixStats = getDatasetMatrixStats(data);
  if (!catalogs) return null;

  return (
    <div>
      <Typography.Text strong>Matrix summary</Typography.Text>
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        {Object.entries(matrixStats.byMeasureStatPopulationSet).map(([measureId, statMap]) => (
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
                return `${catalogs.stats[statId]?.label ?? statId} ${total} (${perPopulationSet})`;
              })
              .join(" · ")}
          </Typography.Text>
        ))}
      </Space>
    </div>
  );
}

export default MatrixSummarySection;
