import { Space, Typography } from "antd";
import type { ConnectivityCatalogs } from "@/types/catalogs";
import type { MatrixStats } from "@/types/datasetState";

type MatrixSummarySectionProps = {
  byMeasureStatPopulationSet: MatrixStats["byMeasureStatPopulationSet"];
  measures: ConnectivityCatalogs["measures"];
  stats: ConnectivityCatalogs["stats"];
  populations: ConnectivityCatalogs["populations"];
};

function MatrixSummarySection({
  byMeasureStatPopulationSet,
  measures,
  stats,
  populations,
}: MatrixSummarySectionProps) {
  return (
    <div>
      <Typography.Text strong>Matrix summary</Typography.Text>
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        {Object.entries(byMeasureStatPopulationSet).map(([measureId, statMap]) => (
          <Typography.Text key={measureId} type="secondary">
            {(measures[measureId]?.label ?? measureId) + ": "}
            {Object.entries(statMap)
              .map(([statId, popMap]) => {
                const total = Object.values(popMap).reduce(
                  (acc, value) => acc + value,
                  0,
                );
                const perPopulationSet = Object.entries(popMap)
                  .map(([populationKey, count]) => {
                    const label = populationKey
                      .split("+")
                      .map((id) => populations[id]?.label ?? id)
                      .join("+");
                    return `${label} ${count}`;
                  })
                  .join(", ");
                return `${stats[statId]?.label ?? statId} ${total} (${perPopulationSet})`;
              })
              .join(" · ")}
          </Typography.Text>
        ))}
      </Space>
    </div>
  );
}

export default MatrixSummarySection;
