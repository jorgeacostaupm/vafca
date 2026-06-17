import { useMemo } from "react";

import type { AtlasState } from "@/types/atlas";
import type { AtlasDefinition } from "@/types/atlas";
import type { DatasetNetworkSummary } from "@/types/datasetNetworkView";
import type { DatasetMeta } from "@/types/datasetState";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import {
  getDatasetCatalogs,
  getDatasetNodeOrder,
} from "@/utils/datasetAccessors";
import {
  buildNetworkSummaryLabel,
  formatPopulationSetLabel,
  hasOnlyEnabledPopulations,
  isEnabled,
  normalizePopulationKey,
} from "@/utils/matrixViewUtils";
import { buildLabelNameMap, normalizeNodeOrder } from "@/utils/nodeOrder";

type Option = { value: string; label: string };

type LabelFormatter = (args: {
  summary: DatasetNetworkSummary;
  dataset: DatasetMeta | null;
}) => string;

type UseNetworkFilterOptionsArgs = {
  dataset: DatasetMeta | null;
  atlas: AtlasState;
  summaries: DatasetNetworkSummary[];
  populationKey: string;
  measureId: string;
  statId: string;
  layerId: string;
  atlasDefinition?: AtlasDefinition | null;
  useMatrixHierarchyOrder?: boolean;
  labelFormatter?: LabelFormatter;
};

const defaultLabelFormatter: LabelFormatter = ({ summary, dataset }) =>
  buildNetworkSummaryLabel(summary, getDatasetCatalogs(dataset));

export const useNetworkFilterOptions = ({
  dataset,
  atlas,
  summaries,
  populationKey,
  measureId,
  statId,
  layerId,
  atlasDefinition,
  useMatrixHierarchyOrder = false,
  labelFormatter = defaultLabelFormatter,
}: UseNetworkFilterOptionsArgs) => {
  const catalogs = getDatasetCatalogs(dataset);
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
    if (!atlasDefinition?.nodes?.length) return baseIds;
    if (atlas.colorFields.length === 0) return baseIds;

    const hierarchyLayout = buildCircularHierarchyLayout({
      labelIds: baseIds,
      radius: 1,
      atlasDefinition,
      hierarchyFields: atlas.colorFields,
      categoryOrder: atlas.matrixHierarchyCategoryOrder,
    });
    if (hierarchyLayout.length === 0) return baseIds;

    return [...hierarchyLayout]
      .sort((a, b) => a.order - b.order)
      .map((item) => item.labelId);
  }, [atlas, nodeOrderIds, atlasDefinition, useMatrixHierarchyOrder]);

  const populationOptions = useMemo<Option[]>(() => {
    const keys = new Set(
      summaries
        .filter((summary) =>
          hasOnlyEnabledPopulations(
            summary.populationIds,
            catalogs?.populations,
          ),
        )
        .map((summary) => normalizePopulationKey(summary.populationIds)),
    );

    return Array.from(keys)
      .sort()
      .map((key) => ({
        value: key,
        label: formatPopulationSetLabel(key.split("+"), catalogs),
      }));
  }, [summaries, catalogs]);

  const measures = useMemo<Option[]>(() => {
    const filtered = summaries.filter((summary) => {
      if (
        populationKey &&
        normalizePopulationKey(summary.populationIds) !== populationKey
      ) {
        return false;
      }
      return true;
    });

    const ids = new Set(filtered.map((summary) => summary.measureId));

    return Array.from(ids)
      .filter((id) => isEnabled(catalogs?.measures[id]))
      .sort()
      .map((id) => ({
        value: id,
        label: catalogs?.measures[id]?.label ?? id,
      }));
  }, [summaries, populationKey, catalogs]);

  const statOptions = useMemo<Option[]>(() => {
    const filtered = summaries.filter((summary) => {
      if (
        populationKey &&
        normalizePopulationKey(summary.populationIds) !== populationKey
      ) {
        return false;
      }
      if (measureId && summary.measureId !== measureId) return false;
      return true;
    });

    return Array.from(new Set(filtered.map((summary) => summary.statId)))
      .filter((id) => isEnabled(catalogs?.statistics[id]))
      .sort()
      .map((id) => ({
        value: id,
        label: catalogs?.statistics[id]?.label ?? id,
      }));
  }, [summaries, populationKey, measureId, catalogs]);

  const layerOptions = useMemo<Option[]>(() => {
    const filtered = summaries.filter((summary) => {
      if (
        populationKey &&
        normalizePopulationKey(summary.populationIds) !== populationKey
      ) {
        return false;
      }
      if (measureId && summary.measureId !== measureId) return false;
      if (statId && summary.statId !== statId) return false;
      return true;
    });

    return Array.from(new Set(filtered.map((summary) => summary.layerId)))
      .filter((id) => isEnabled(catalogs?.layers[id]))
      .sort()
      .map((id) => ({
        value: id,
        label: catalogs?.layers[id]?.label ?? id,
      }));
  }, [summaries, populationKey, measureId, statId, catalogs]);

  const selectableNetworkSummaries = useMemo(() => {
    return summaries.filter((summary) => {
      if (!isEnabled(catalogs?.measures[summary.measureId])) return false;
      if (!isEnabled(catalogs?.layers[summary.layerId])) return false;
      if (!isEnabled(catalogs?.statistics[summary.statId])) return false;
      if (
        !hasOnlyEnabledPopulations(
          summary.populationIds,
          catalogs?.populations,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [summaries, catalogs]);

  const matches = useMemo(() => {
    return selectableNetworkSummaries.filter((summary) => {
      if (
        populationKey &&
        normalizePopulationKey(summary.populationIds) !== populationKey
      ) {
        return false;
      }
      if (measureId && summary.measureId !== measureId) return false;
      if (statId && summary.statId !== statId) return false;
      if (layerId && summary.layerId !== layerId) return false;
      return true;
    });
  }, [selectableNetworkSummaries, populationKey, measureId, statId, layerId]);

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
    populationOptions,
    measures,
    statOptions,
    layerOptions,
    matches,
    networkOptions,
    allNetworkOptions,
    selectableNetworkSummaries,
    labelOptions,
  };
};
