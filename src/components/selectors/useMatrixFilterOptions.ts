import { useMemo } from "react";
import type { DatasetMeta } from "@/types/datasetState";
import type { AtlasState } from "@/types/atlas";
import type { AtlasDefinition } from "@/types/atlas";
import type { MatrixSummary } from "@/types/matrixStore";
import { buildLabelNameMap, normalizeMatrixOrder } from "@/utils/matrixOrder";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import {
  buildMatrixLabel,
  formatPopulationSetLabel,
  hasOnlyEnabledPopulations,
  isEnabled,
  normalizePopulationKey,
} from "@/utils/matrixViewUtils";
import {
  getDatasetCatalogs,
  getDatasetMatrixOrder,
} from "@/utils/datasetAccessors";

type Option = { value: string; label: string };

type LabelFormatter = (args: {
  summary: MatrixSummary;
  dataset: DatasetMeta | null;
}) => string;

type UseMatrixFilterOptionsArgs = {
  dataset: DatasetMeta | null;
  atlas: AtlasState;
  summaries: MatrixSummary[];
  populationKey: string;
  measureId: string;
  statId: string;
  layerId: string;
  atlasDefinition?: AtlasDefinition | null;
  useMatrixHierarchyOrder?: boolean;
  labelFormatter?: LabelFormatter;
};

const defaultLabelFormatter: LabelFormatter = ({ summary, dataset }) =>
  buildMatrixLabel(summary, getDatasetCatalogs(dataset));

export const useMatrixFilterOptions = ({
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
}: UseMatrixFilterOptionsArgs) => {
  const catalogs = getDatasetCatalogs(dataset);
  const matrixOrderEntries = useMemo(
    () => normalizeMatrixOrder(getDatasetMatrixOrder(dataset)),
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
      .filter((id) => isEnabled(catalogs?.stats[id]))
      .sort()
      .map((id) => ({
        value: id,
        label: catalogs?.stats[id]?.label ?? id,
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

  const selectableMatrixSummaries = useMemo(() => {
    return summaries.filter((summary) => {
      if (!isEnabled(catalogs?.measures[summary.measureId])) return false;
      if (!isEnabled(catalogs?.layers[summary.layerId])) return false;
      if (!isEnabled(catalogs?.stats[summary.statId])) return false;
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
    return selectableMatrixSummaries.filter((summary) => {
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
  }, [selectableMatrixSummaries, populationKey, measureId, statId, layerId]);

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
    layerOptions,
    matches,
    matrixOptions,
    allMatrixOptions,
    selectableMatrixSummaries,
    labelOptions,
  };
};
