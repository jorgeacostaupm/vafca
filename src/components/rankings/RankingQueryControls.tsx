import { Button, Form, Radio, Select } from "antd";
import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { patchRankingQuery, runRankingQuery } from "@/store/slices/rankings";
import {
  ALL_RANKING_MEASURES,
  ALL_RANKING_SOURCES,
  ALL_RANKING_STATISTICS,
  getCompatibleBandOptions,
  getMeasureOptions,
  getRankingQueryMissingFields,
  getSourceOptions,
  getStatisticOptions,
  linkMetricOptions,
  matrixMetricOptions,
  roiMetricOptions,
  topNOptions,
} from "@/components/rankings/rankingOptions";
import type {
  RankingTarget,
  RankingTopN,
} from "@/types/rankings";
import { ALL_COMPATIBLE_BANDS } from "@/utils/rankings/rankingMatrixMetadata";

const splitSourceValue = (value?: string) => {
  if (!value || value === ALL_RANKING_SOURCES) {
    return { sourceType: undefined, sourceId: undefined };
  }
  const [sourceType, ...rest] = value.split("::");
  return {
    sourceType: sourceType as "population" | "subject" | "comparison",
    sourceId: rest.join("::"),
  };
};

export default function RankingQueryControls() {
  const dispatch = useAppDispatch();
  const query = useAppSelector((state) => state.rankings.currentQuery);
  const status = useAppSelector((state) => state.rankings.status);
  const connectivity = useAppSelector((state) => state.dataset.data?.connectivity);

  const metricOptions =
    query.target === "matrices"
      ? matrixMetricOptions
      : query.target === "links"
        ? linkMetricOptions
        : roiMetricOptions;
  const sourceOptions = useMemo(
    () => getSourceOptions(connectivity, query),
    [connectivity, query],
  );
  const measureOptions = useMemo(
    () => getMeasureOptions(connectivity, query),
    [connectivity, query],
  );
  const statisticOptions = useMemo(
    () => getStatisticOptions(connectivity, query),
    [connectivity, query],
  );
  const bandOptions = useMemo(
    () => getCompatibleBandOptions(connectivity, query),
    [connectivity, query],
  );
  const selectedSourceValue =
    query.sourceType && query.sourceId
      ? `${query.sourceType}::${query.sourceId}`
      : ALL_RANKING_SOURCES;
  const selectedMeasureValue = query.measureId ?? ALL_RANKING_MEASURES;
  const selectedStatisticValue = query.statisticId ?? ALL_RANKING_STATISTICS;
  const selectedBandValues =
    query.bandIds && query.bandIds.length > 0
      ? query.bandIds
      : [ALL_COMPATIBLE_BANDS];
  const selectedBandCount = query.bandIds?.includes(ALL_COMPATIBLE_BANDS)
    ? 2
    : query.bandIds?.length ?? 0;
  const isCollectionMode = selectedBandCount !== 1;
  const missingFields = getRankingQueryMissingFields(query, connectivity);
  const canAddRanking = missingFields.length === 0 && status !== "loading";

  const updateTarget = (target: RankingTarget) => {
    dispatch(
      patchRankingQuery({
        target,
        mode: "matrixCollection",
        metric:
          target === "matrices"
            ? "meanAbsValue"
            : target === "links"
              ? "highestAbsValue"
              : "meanAbsValue",
        sourceType: undefined,
        sourceId: undefined,
        measureId: undefined,
        statisticId: undefined,
        bandIds: undefined,
        matrixId: undefined,
      }),
    );
  };

  const updateSource = (value?: string) => {
    const source = splitSourceValue(value);
    dispatch(
      patchRankingQuery({
        ...source,
        measureId: undefined,
        statisticId: undefined,
        bandIds: undefined,
        matrixId: undefined,
      }),
    );
  };

  const updateMeasure = (measureId?: string) => {
    dispatch(
      patchRankingQuery({
        measureId:
          !measureId || measureId === ALL_RANKING_MEASURES
            ? undefined
            : measureId,
        statisticId: undefined,
        bandIds: undefined,
        matrixId: undefined,
      }),
    );
  };

  const updateStatistic = (statisticId?: string) => {
    dispatch(
      patchRankingQuery({
        statisticId:
          !statisticId || statisticId === ALL_RANKING_STATISTICS
            ? undefined
            : statisticId,
        bandIds: undefined,
        matrixId: undefined,
      }),
    );
  };

  const updateBands = (bandIds?: string[]) => {
    const switchedFromAllToSpecific =
      selectedBandValues.includes(ALL_COMPATIBLE_BANDS) &&
      bandIds &&
      bandIds.length > 1 &&
      bandIds.includes(ALL_COMPATIBLE_BANDS);
    const nextBandIds =
      switchedFromAllToSpecific
        ? bandIds.filter((bandId) => bandId !== ALL_COMPATIBLE_BANDS)
        : !bandIds || bandIds.length === 0 || bandIds.includes(ALL_COMPATIBLE_BANDS)
          ? undefined
          : bandIds;
    dispatch(
      patchRankingQuery({
        bandIds: nextBandIds,
        mode: nextBandIds?.length === 1 ? "singleMatrix" : "matrixCollection",
        matrixId: undefined,
      }),
    );
  };

  return (
    <Form layout="vertical" className="network-selector-controls ranking-query-controls">
      <Form.Item label="Ranking target">
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={query.target}
          onChange={(event) => updateTarget(event.target.value as RankingTarget)}
          options={[
            { label: "Matrices", value: "matrices" },
            { label: "Links", value: "links" },
            { label: "ROIs", value: "rois" },
          ]}
        />
      </Form.Item>

      {query.target === "links" && isCollectionMode ? (
        <Form.Item label="Multi-band mode">
          <Radio.Group
            optionType="button"
            value={query.linkCollectionMode}
            onChange={(event) =>
              dispatch(patchRankingQuery({ linkCollectionMode: event.target.value }))
            }
            options={[
              { label: "Aggregated", value: "aggregated" },
              { label: "One row per band", value: "expanded" },
            ]}
          />
        </Form.Item>
      ) : null}

      <Form.Item label="Source">
        <Select
          placeholder="Select a source..."
          value={selectedSourceValue}
          options={sourceOptions}
          onChange={updateSource}
        />
      </Form.Item>
      <Form.Item label="Measure">
        <Select
          placeholder="Select a measure..."
          value={selectedMeasureValue}
          disabled={!connectivity}
          options={measureOptions}
          onChange={updateMeasure}
        />
      </Form.Item>
      <Form.Item label="Statistic">
        <Select
          placeholder="Select a statistic..."
          value={selectedStatisticValue}
          disabled={!connectivity}
          options={statisticOptions}
          onChange={updateStatistic}
        />
      </Form.Item>
      <Form.Item label="Bands" className="ranking-query-controls__bands">
        <Select
          placeholder="Select bands..."
          mode="multiple"
          value={selectedBandValues}
          disabled={!connectivity}
          options={bandOptions}
          onChange={updateBands}
        />
      </Form.Item>

      <Form.Item label="Ranking metric">
        <Select
          value={query.metric}
          options={metricOptions}
          onChange={(metric) => dispatch(patchRankingQuery({ metric }))}
        />
      </Form.Item>
      <Form.Item label="Top N">
        <Select
          value={query.topN}
          options={topNOptions}
          onChange={(topN: RankingTopN) => dispatch(patchRankingQuery({ topN }))}
        />
      </Form.Item>

      <div className="network-selector-controls__submit">
        <Button
          type="primary"
          loading={status === "loading"}
          disabled={!canAddRanking}
          onClick={() => void dispatch(runRankingQuery())}
        >
          Add ranking
        </Button>
      </div>
    </Form>
  );
}
