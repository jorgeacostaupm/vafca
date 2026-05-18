import { useMemo } from "react";
import type { DatasetState } from "@/types/datasetState";
import type { AtlasState } from "@/types/atlas";
import type { AtlasDefinition } from "@/types/atlas";
import type { MatrixSummary } from "@/types/matrixStore";
import { buildLabelNameMap, normalizeMatrixOrder } from "@/utils/matrixOrder";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import {
  buildMatrixLabel,
  hasOnlyEnabledPopulations,
  isEnabled,
  normalizePopulationKey,
} from "@/utils/matrixViewUtils";

type Option = { value: string; label: string };

type LabelFormatter = (args: {
  summary: MatrixSummary;
  dataset: DatasetState["data"];
}) => string;

type UseMatrixFilterOptionsArgs = {
  dataset: DatasetState["data"];
  atlas: AtlasState;
  summaries: MatrixSummary[];
  populationKey: string;
  measureId: string;
  statId: string;
  bandId: string;
  atlasDefinition?: AtlasDefinition | null;
  useMatrixHierarchyOrder?: boolean;
  labelFormatter?: LabelFormatter;
};

const defaultLabelFormatter: LabelFormatter = ({ summary, dataset }) =>
  buildMatrixLabel(summary, dataset?.catalogs);

export const useMatrixFilterOptions = ({
  dataset,
  atlas,
  summaries,
  populationKey,
  measureId,
  statId,
  bandId,
  atlasDefinition,
  useMatrixHierarchyOrder = false,
  labelFormatter = defaultLabelFormatter,
}: UseMatrixFilterOptionsArgs) => {
  const matrixOrderEntries = useMemo(
    () => normalizeMatrixOrder(dataset?.metadata.matrixOrder),
    [dataset],
  );

  const matrixOrderIds = useMemo(
    () => matrixOrderEntries.map((entry) => entry.id),
    [matrixOrderEntries],
  );

  const labelNames = useMemo(
    () =>
      atlas.order.length === 0
        ? buildLabelNameMap(matrixOrderEntries)
        : atlas.order.reduce<Record<string, string>>((acc, id) => {
            const label = atlas.labelsById[id];
            const acronym = label?.acronym?.trim();
            const name = label?.label?.trim();
            acc[id] = acronym ?? name ?? id;
            return acc;
          }, {}),
    [atlas, matrixOrderEntries],
  );

  const activeLabelIds = useMemo(() => {
    if (atlas.order.length === 0) return matrixOrderIds;
    const baseIds = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    if (!useMatrixHierarchyOrder) return baseIds;
    if (!atlasDefinition?.rois?.length) return baseIds;
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
  }, [atlas, matrixOrderIds, atlasDefinition, useMatrixHierarchyOrder]);

  const populationOptions = useMemo<Option[]>(() => {
    const keys = new Set(
      summaries
        .filter((summary) =>
          hasOnlyEnabledPopulations(
            summary.populationIds,
            dataset?.catalogs.populations,
          ),
        )
        .map((summary) => normalizePopulationKey(summary.populationIds)),
    );

    return Array.from(keys)
      .sort()
      .map((key) => ({ value: key, label: key }));
  }, [summaries, dataset]);

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
      .filter((id) => isEnabled(dataset?.catalogs.measures[id]))
      .sort()
      .map((id) => ({
        value: id,
        label: dataset?.catalogs.measures[id]?.label ?? id,
      }));
  }, [summaries, populationKey, dataset]);

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
      .filter((id) => isEnabled(dataset?.catalogs.stats[id]))
      .sort()
      .map((id) => ({
        value: id,
        label: dataset?.catalogs.stats[id]?.label ?? id,
      }));
  }, [summaries, populationKey, measureId, dataset]);

  const bandOptions = useMemo<Option[]>(() => {
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

    return Array.from(new Set(filtered.map((summary) => summary.bandId)))
      .filter((id) => isEnabled(dataset?.catalogs.bands[id]))
      .sort()
      .map((id) => ({
        value: id,
        label: dataset?.catalogs.bands[id]?.label ?? id,
      }));
  }, [summaries, populationKey, measureId, statId, dataset]);

  const selectableMatrixSummaries = useMemo(() => {
    return summaries.filter((summary) => {
      if (!isEnabled(dataset?.catalogs.measures[summary.measureId])) return false;
      if (!isEnabled(dataset?.catalogs.bands[summary.bandId])) return false;
      if (!isEnabled(dataset?.catalogs.stats[summary.statId])) return false;
      if (
        !hasOnlyEnabledPopulations(
          summary.populationIds,
          dataset?.catalogs.populations,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [summaries, dataset]);

  const matches = useMemo(() => {
    return selectableMatrixSummaries.filter((summary) => {
      if (
        populationKey &&
        normalizePopulationKey(summary.populationIds) !== populationKey
      ) {
        return false;
      }
      if (measureId && summary.measureId !== measureId) return false;
      if (statId && summary.statId !== statId) return false;
      if (bandId && summary.bandId !== bandId) return false;
      return true;
    });
  }, [selectableMatrixSummaries, populationKey, measureId, statId, bandId]);

  const allMatrixOptions = useMemo<Option[]>(() => {
    return selectableMatrixSummaries.map((summary) => ({
      value: summary.compoundId,
      label: labelFormatter({ summary, dataset }),
    }));
  }, [selectableMatrixSummaries, dataset, labelFormatter]);

  const matrixOptions = useMemo<Option[]>(() => {
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
    matrixOrderIds,
    labelNames,
    activeLabelIds,
    populationOptions,
    measures,
    statOptions,
    bandOptions,
    matches,
    matrixOptions,
    allMatrixOptions,
    selectableMatrixSummaries,
    labelOptions,
  };
};
