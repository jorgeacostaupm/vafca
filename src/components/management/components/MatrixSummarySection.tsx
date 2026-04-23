import { Space, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";

function MatrixSummarySection() {
  const data = useAppSelector((state) => state.dataset.data);

  if (!data) return null;

  return (
    <div>
      <Typography.Text strong>Matrix summary</Typography.Text>
      <Space direction="vertical" size={4} style={{ width: "100%" }}>
        {Object.entries(data.matrixStats.byMeasureStatPopulationSet).map(([measureId, statMap]) => (
          <Typography.Text key={measureId} type="secondary">
            {(data.catalogs.measures[measureId]?.label ?? measureId) + ": "}
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
                      .map((id) => data.catalogs.populations[id]?.label ?? id)
                      .join("+");
                    return `${label} ${count}`;
                  })
                  .join(", ");
                return `${data.catalogs.stats[statId]?.label ?? statId} ${total} (${perPopulationSet})`;
              })
              .join(" · ")}
          </Typography.Text>
        ))}
      </Space>
    </div>
  );
}

export default MatrixSummarySection;
