import { useMemo } from "react";

import type { AtlasState } from "@/types/atlas";
import type { AtlasDefinition } from "@/types/atlas";
import type { DatasetNetworkSummary } from "@/types/datasetNetworkView";
import type { DatasetMeta } from "@/types/datasetState";
import {
  getDatasetCatalogs,
  getDatasetNodeOrder,
} from "@/utils/datasetAccessors";
import {
  buildNetworkSummaryLabel,
  hasEnabledSource,
  isEnabled,
} from "@/utils/matrixViewUtils";
import { buildLabelNameMap, normalizeNodeOrder } from "@/utils/nodeOrder";
import { orderAtlasLabels } from "@/utils/orderAtlasLabels";

type Option = { value: string; label: string };

export type AspectFilterOptions = {
  id: string;
  label: string;
  options: Option[];
  disabled: boolean;
};

type LabelFormatter = (args: {
  summary: DatasetNetworkSummary;
  dataset: DatasetMeta | null;
}) => string;

type UseNetworkFilterOptionsArgs = {
  dataset: DatasetMeta | null;
  atlas: AtlasState;
  summaries: DatasetNetworkSummary[];
  sourceId: string;
  measureId: string;
  statisticId: string;
  aspectFilters: Record<string, string>;
  atlasDefinition?: AtlasDefinition | null;
  useMatrixHierarchyOrder?: boolean;
  labelFormatter?: LabelFormatter;
};

const defaultLabelFormatter: LabelFormatter = ({ summary, dataset }) =>
  buildNetworkSummaryLabel(summary, getDatasetCatalogs(dataset));

const sortOptions = (options: Option[]) =>
  [...options].sort((a, b) => a.label.localeCompare(b.label));

const uniqueOptions = (
  ids: Iterable<string>,
  labelForId: (id: string) => string,
) => sortOptions(
  Array.from(new Set(ids)).map((id) => ({
    value: id,
    label: labelForId(id),
  })),
);

const matchesCore = (
  summary: DatasetNetworkSummary,
  sourceId: string,
  measureId: string,
  statisticId: string,
) =>
  (!sourceId || summary.sourceId === sourceId) &&
  (!measureId || summary.measureId === measureId) &&
  (!statisticId || summary.statisticId === statisticId);

const matchesAspectFilters = (
  summary: DatasetNetworkSummary,
  aspectFilters: Record<string, string>,
  aspectIds?: string[],
) => {
  const entries = Object.entries(aspectFilters).filter((entry) =>
    aspectIds ? aspectIds.includes(entry[0]) : true,
  );
  return entries.every(([id, value]) => !value || summary.dimensions[id] === value);
};

export const useNetworkFilterOptions = ({
  dataset,
  atlas,
  summaries,
  sourceId,
  measureId,
  statisticId,
  aspectFilters,
  atlasDefinition,
  useMatrixHierarchyOrder = false,
  labelFormatter = defaultLabelFormatter,
}: UseNetworkFilterOptionsArgs) => {
  const catalogs = getDatasetCatalogs(dataset);
  const aspects = catalogs?.aspects ?? [];
  const nodeOrderEntries = useMemo(
    () => normalizeNodeOrder(getDatasetNodeOrder(dataset)),
    [dataset],
  );

  const nodeOrderIds = useMemo(
    () => nodeOrderEntries.map((entry) => entry.id),
    [nodeOrderEntries],
  );

  const labelNames = useMemo(
    () =>
      atlas.order.length === 0
        ? buildLabelNameMap(nodeOrderEntries)
        : atlas.order.reduce<Record<string, string>>((acc, id) => {
            const label = atlas.labelsById[id];
            const acronym = label?.acronym?.trim();
            const name = label?.label?.trim();
            acc[id] = acronym ?? name ?? id;
            return acc;
          }, {}),
    [atlas, nodeOrderEntries],
  );

  const activeLabelIds = useMemo(() => {
    if (atlas.order.length === 0) return nodeOrderIds;
    const baseIds = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    if (!useMatrixHierarchyOrder) return baseIds;
    return orderAtlasLabels(baseIds, atlasDefinition, atlas.matrixHierarchyFields, atlas.matrixHierarchyCategoryOrder);
  }, [atlas, nodeOrderIds, atlasDefinition, useMatrixHierarchyOrder]);

  const selectableNetworkSummaries = useMemo(() => {
    return summaries.filter((summary) => {
      if (!hasEnabledSource(summary.sourceId, catalogs?.sources)) return false;
      if (!isEnabled(catalogs?.measures[summary.measureId])) return false;
      if (!isEnabled(catalogs?.statistics[summary.statisticId])) return false;
      return aspects.every((aspect) =>
        isEnabled(catalogs?.aspectCatalogs[aspect.id]?.[summary.dimensions[aspect.id]]),
      );
    });
  }, [summaries, catalogs, aspects]);

  const sourceOptions = useMemo<Option[]>(() => {
    return uniqueOptions(
      selectableNetworkSummaries.map((summary) => summary.sourceId),
      (id) => catalogs?.sources[id]?.label ?? id,
    );
  }, [selectableNetworkSummaries, catalogs]);

  const measures = useMemo<Option[]>(() => {
    const filtered = selectableNetworkSummaries.filter((summary) =>
      matchesCore(summary, sourceId, "", ""),
    );
    return uniqueOptions(
      filtered.map((summary) => summary.measureId),
      (id) => catalogs?.measures[id]?.label ?? id,
    );
  }, [selectableNetworkSummaries, sourceId, catalogs]);

  const statisticOptions = useMemo<Option[]>(() => {
    const filtered = selectableNetworkSummaries.filter((summary) =>
      matchesCore(summary, sourceId, measureId, ""),
    );
    return uniqueOptions(
      filtered.map((summary) => summary.statisticId),
      (id) => catalogs?.statistics[id]?.label ?? id,
    );
  }, [selectableNetworkSummaries, sourceId, measureId, catalogs]);

  const aspectOptions = useMemo<AspectFilterOptions[]>(() => {
    return aspects.map((aspect, index) => {
      const previousAspectIds = aspects.slice(0, index).map((item) => item.id);
      const filtered = selectableNetworkSummaries.filter(
        (summary) =>
          matchesCore(summary, sourceId, measureId, statisticId) &&
          matchesAspectFilters(summary, aspectFilters, previousAspectIds),
      );
      return {
        id: aspect.id,
        label: aspect.label,
        disabled: !statisticId,
        options: uniqueOptions(
          filtered
            .map((summary) => summary.dimensions[aspect.id])
            .filter((id): id is string => Boolean(id)),
          (id) => catalogs?.aspectCatalogs[aspect.id]?.[id]?.label ?? id,
        ),
      };
    });
  }, [
    aspects,
    selectableNetworkSummaries,
    sourceId,
    measureId,
    statisticId,
    aspectFilters,
    catalogs,
  ]);

  const matches = useMemo(() => {
    return selectableNetworkSummaries.filter(
      (summary) =>
        matchesCore(summary, sourceId, measureId, statisticId) &&
        matchesAspectFilters(summary, aspectFilters),
    );
  }, [selectableNetworkSummaries, sourceId, measureId, statisticId, aspectFilters]);

  const allNetworkOptions = useMemo<Option[]>(() => {
    return selectableNetworkSummaries.map((summary) => ({
      value: summary.compoundId,
      label: labelFormatter({ summary, dataset }),
    }));
  }, [selectableNetworkSummaries, dataset, labelFormatter]);

  const networkOptions = useMemo<Option[]>(() => {
    return matches.map((summary) => ({
      value: summary.compoundId,
      label: labelFormatter({ summary, dataset }),
    }));
  }, [matches, dataset, labelFormatter]);

  const labelOptions = useMemo<Option[]>(
    () =>
      activeLabelIds.map((id) => ({
        value: id,
        label: labelNames[id] ?? id,
      })),
    [activeLabelIds, labelNames],
  );

  return {
    nodeOrderIds,
    labelNames,
    activeLabelIds,
    sourceOptions,
    measures,
    statisticOptions,
    aspectOptions,
    matches,
    networkOptions,
    allNetworkOptions,
    selectableNetworkSummaries,
    labelOptions,
  };
};
