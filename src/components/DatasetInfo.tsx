import { List, Space, Typography } from "antd";
import { useAppSelector } from "@/store/hooks";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";

function DatasetInfo() {
  const { data, status, error } = useAppSelector((state) => state.dataset);

  if (status === "loading") {
    return <Typography.Text>Loading dataset…</Typography.Text>;
  }

  if (status === "error") {
    return <Typography.Text type="danger">Error: {error}</Typography.Text>;
  }

  if (!data) {
    return <Typography.Text>No dataset loaded yet.</Typography.Text>;
  }

  const matrixOrder = normalizeMatrixOrder(data.metadata.matrixOrder);
  const atlasLabel = data.metadata.atlasId ?? data.metadata.atlas ?? "Unknown";
  const bands = Object.values(data.catalogs.bands);
  const measures = Object.values(data.catalogs.measures);
  const stats = Object.values(data.catalogs.stats);
  const populations = Object.values(data.catalogs.populations);
  const statCounts = data.matrixStats.byStat;
  const measureSummary = data.matrixStats.byMeasureStatPopulation;
  const getTotal = (popMap: Record<string, number> | undefined) => {
    if (!popMap) return 0;
    return Object.values(popMap).reduce((acc, value) => acc + value, 0);
  };
  const formatRange = (min: number | undefined, max: number | undefined) => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return `${min}–${max}`;
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Space direction="vertical" size={4}>
        <Typography.Text strong>Atlas</Typography.Text>
        <Typography.Text type="secondary">{atlasLabel}</Typography.Text>
        <Typography.Text strong>ROI count</Typography.Text>
        <Typography.Text type="secondary">{matrixOrder.length}</Typography.Text>
        <Typography.Text strong>Matrices</Typography.Text>
        <Typography.Text type="secondary">{data.matrixStats.total}</Typography.Text>
      </Space>

      <div>
        <Typography.Text strong>Matrix summary</Typography.Text>
        <List
          size="small"
          dataSource={Object.entries(measureSummary)}
          renderItem={([measureId, statMap]) => (
            <List.Item>
              <Typography.Text>
                {data.catalogs.measures[measureId]?.label ?? measureId}: {" "}
                {stats
                  .map((stat) => {
                    const popMap = statMap[stat.id];
                    const total = getTotal(popMap);
                    const perPopulation = populations
                      .map(
                        (population) =>
                          `${population.label ?? population.id} ${
                            popMap?.[population.id] ?? 0
                          }`,
                      )
                      .join(", ");
                    return `${stat.label ?? stat.id} ${total} (${perPopulation})`;
                  })
                  .join(" · ")}
              </Typography.Text>
            </List.Item>
          )}
        />
      </div>

      <div>
        <Typography.Text strong>Bands</Typography.Text>
        <List
          size="small"
          dataSource={bands}
          renderItem={(band) => (
            <List.Item>
              <Typography.Text>
                {(band.label ?? band.id)} ({band.min}-{band.max} Hz)
                {band.description ? ` · ${band.description}` : ""}
              </Typography.Text>
            </List.Item>
          )}
        />
      </div>

      <div>
        <Typography.Text strong>Measures</Typography.Text>
        <List
          size="small"
          dataSource={measures}
          renderItem={(measure) => (
            <List.Item>
              <Typography.Text>
                {measure.label ?? measure.id}
                {formatRange(measure.min, measure.max)
                  ? ` · range ${formatRange(measure.min, measure.max)}`
                  : ""}
                {measure.description ? ` · ${measure.description}` : ""}
              </Typography.Text>
            </List.Item>
          )}
        />
      </div>

      <div>
        <Typography.Text strong>Statistics</Typography.Text>
        <List
          size="small"
          dataSource={stats}
          renderItem={(stat) => (
            <List.Item>
              <Typography.Text>
                {stat.label ?? stat.id}
                {formatRange(stat.min, stat.max)
                  ? ` · range ${formatRange(stat.min, stat.max)}`
                  : ""}
                {stat.description ? ` · ${stat.description}` : ""} · {" "}
                {statCounts[stat.id] ?? 0} matrices
              </Typography.Text>
            </List.Item>
          )}
        />
      </div>

      <div>
        <Typography.Text strong>Populations</Typography.Text>
        <List
          size="small"
          dataSource={populations}
          renderItem={(population) => (
            <List.Item>
              <Typography.Text>
                {population.label ?? population.id}
                {population.description ? ` · ${population.description}` : ""}
              </Typography.Text>
            </List.Item>
          )}
        />
      </div>
    </Space>
  );
}

export default DatasetInfo;
