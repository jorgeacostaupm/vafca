import {
  AimOutlined,
  AppstoreOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { Button, Form, Segmented, Select } from "antd";
import { useMemo } from "react";
import { createNetworkSegmentedOption } from "@/components/network/segmentedOption";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  patchRankingQuery,
  runRankingQuery,
  setRankingTarget,
} from "@/store/slices/rankings";
import {
  getCompatibleLayerOptions,
  getMeasureOptions,
  getRankingLayerSelectionPatch,
  getRankingQueryMissingFields,
  getSourceOptions,
  getStatisticOptions,
  linkMetricOptions,
  matrixMetricOptions,
  roiMetricOptions,
} from "@/components/rankings/rankingOptions";
import type { RankingTarget } from "@/types/rankings";
import { ALL_COMPATIBLE_LAYERS } from "@/utils/rankings/rankingMatrixMetadata";

const rankingTargetOptions = [
  createNetworkSegmentedOption<RankingTarget>(
    "matrices",
    <AppstoreOutlined />,
    "Network",
  ),
  createNetworkSegmentedOption<RankingTarget>("links", <LinkOutlined />, "Links"),
  createNetworkSegmentedOption<RankingTarget>("rois", <AimOutlined />, "ROIs"),
];

const splitSourceValue = (value?: string) => {
  if (!value) {
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
  const layerOptions = useMemo(
    () => getCompatibleLayerOptions(connectivity, query),
    [connectivity, query],
  );
  const isRoiRanking = query.target === "rois";
  const selectableLayerOptions = useMemo(
    () =>
      isRoiRanking
        ? layerOptions.filter((option) => option.value !== ALL_COMPATIBLE_LAYERS)
        : layerOptions,
    [layerOptions, isRoiRanking],
  );
  const selectedSourceValue =
    query.sourceType && query.sourceId
      ? `${query.sourceType}::${query.sourceId}`
      : undefined;
  const selectedMeasureValue = query.measureId;
  const selectedStatisticValue = query.statisticId;
  const selectedLayerValues = query.layerIds ?? [];
  const selectedSingleLayerValue = query.layerIds?.[0];
  const missingFields = getRankingQueryMissingFields(query, connectivity);
  const canAddRanking = missingFields.length === 0 && status !== "loading";

  const updateTarget = (target: RankingTarget) => {
    dispatch(setRankingTarget(target));
  };

  const updateSource = (value?: string) => {
    const source = splitSourceValue(value);
    dispatch(
      patchRankingQuery({
        ...source,
        matrixId: undefined,
      }),
    );
  };

  const updateMeasure = (measureId?: string) => {
    dispatch(
      patchRankingQuery({
        measureId,
        matrixId: undefined,
      }),
    );
  };

  const updateStatistic = (statisticId?: string) => {
    dispatch(
      patchRankingQuery({
        statisticId,
        matrixId: undefined,
      }),
    );
  };

  const updateLayers = (layerIds?: string[]) => {
    const switchedFromAllToSpecific =
      selectedLayerValues.includes(ALL_COMPATIBLE_LAYERS) &&
      layerIds &&
      layerIds.length > 1 &&
      layerIds.includes(ALL_COMPATIBLE_LAYERS);
    let nextLayerIds: string[];
    if (switchedFromAllToSpecific) {
      nextLayerIds = layerIds.filter((layerId) => layerId !== ALL_COMPATIBLE_LAYERS);
    } else if (!layerIds || layerIds.includes(ALL_COMPATIBLE_LAYERS)) {
      nextLayerIds = layerIds?.includes(ALL_COMPATIBLE_LAYERS)
        ? [ALL_COMPATIBLE_LAYERS]
        : [];
    } else {
      nextLayerIds = layerIds;
    }

    dispatch(
      patchRankingQuery({
        layerIds: nextLayerIds,
        ...getRankingLayerSelectionPatch(connectivity, query, nextLayerIds),
        mode: nextLayerIds?.length === 1 ? "singleMatrix" : "matrixCollection",
        matrixId: undefined,
      }),
    );
  };

  const updateSingleLayer = (layerId?: string) => {
    dispatch(
      patchRankingQuery({
        layerIds: layerId ? [layerId] : [],
        ...getRankingLayerSelectionPatch(
          connectivity,
          query,
          layerId ? [layerId] : [],
        ),
        mode: "singleMatrix",
        matrixId: undefined,
      }),
    );
  };

  return (
    <Form layout="vertical" className="network-selector-controls ranking-query-controls">
      <div className="ranking-query-controls__main-row">
        <Form.Item
          label="Ranking target"
          className="network-segmented-setting ranking-query-controls__target"
        >
          <Segmented
            value={query.target}
            onChange={(value) => updateTarget(value as RankingTarget)}
            options={rankingTargetOptions}
          />
        </Form.Item>

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

        <Form.Item label="Ranking metric">
          <Select
            placeholder="Select a score..."
            value={query.metric}
            options={metricOptions}
            onChange={(metric) => dispatch(patchRankingQuery({ metric }))}
          />
        </Form.Item>

        <Form.Item label="Layers" className="ranking-query-controls__layers">
          {isRoiRanking ? (
            <Select
              placeholder="Select one layer..."
              value={selectedSingleLayerValue}
              disabled={!connectivity}
              options={selectableLayerOptions}
              onChange={updateSingleLayer}
            />
          ) : (
            <Select
              placeholder="Select layers..."
              mode="multiple"
              value={selectedLayerValues}
              disabled={!connectivity}
              options={selectableLayerOptions}
              onChange={updateLayers}
            />
          )}
        </Form.Item>

        <Button
          className="ranking-query-controls__submit"
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
