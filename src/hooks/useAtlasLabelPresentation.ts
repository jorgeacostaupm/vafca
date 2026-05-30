import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import type { AtlasDefinition } from "@/types/atlas";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import {
  buildGroupingColorCategoryKey,
  buildRoiGroupingColorById,
  buildRoiGroupingColorCategories,
} from "@/utils/groupingColoring";
import { buildLabelNameMap, normalizeMatrixOrder } from "@/utils/matrixOrder";
import {
  getDatasetAtlasId,
  getDatasetAtlasLabel,
  getDatasetMatrixOrder,
} from "@/utils/datasetAccessors";

type UseAtlasLabelPresentationArgs = {
  useMatrixHierarchyOrder?: boolean;
};

export const useAtlasLabelPresentation = ({
  useMatrixHierarchyOrder = false,
}: UseAtlasLabelPresentationArgs = {}) => {
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const datasetAtlasId = getDatasetAtlasId(dataset);
  const datasetAtlasLabel = getDatasetAtlasLabel(dataset);

  const atlasDefinition = useAtlasDefinition(datasetAtlasId);

  const stateAtlasDefinition = useMemo<AtlasDefinition | null>(() => {
    if (atlasDefinition || atlas.order.length === 0) return atlasDefinition;

    return {
      id: datasetAtlasId ?? "active-atlas",
      name: datasetAtlasLabel,
      rois: atlas.order.map((id, index) => {
        const label = atlas.labelsById[id];
        return {
          index,
          id,
          atlasId: id,
          name: label?.name ?? label?.label ?? id,
          label: label?.acronym ?? label?.label ?? id,
          tags: label?.tags ?? {},
          metadata: label?.metadata ?? {},
          coords: null,
        };
      }),
    };
  }, [
    atlas.labelsById,
    atlas.order,
    atlasDefinition,
    datasetAtlasId,
    datasetAtlasLabel,
  ]);

  const matrixOrderEntries = useMemo(
    () => normalizeMatrixOrder(getDatasetMatrixOrder(dataset)),
    [dataset],
  );

  const matrixOrderIds = useMemo(
    () => matrixOrderEntries.map((entry) => entry.id),
    [matrixOrderEntries],
  );

  const labelNames = useMemo(
    () => {
      const base =
        atlas.order.length === 0
          ? buildLabelNameMap(matrixOrderEntries)
          : atlas.order.reduce<Record<string, string>>((acc, id) => {
            const label = atlas.labelsById[id];
            const acronym = label?.acronym?.trim();
            const name = label?.label?.trim();
            acc[id] = acronym ?? name ?? id;
            return acc;
          }, {});

      dataset?.content?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.content?.matrices, matrixOrderEntries],
  );

  const labelTitles = useMemo(
    () =>
      {
      const base = atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.name?.trim() || meta.label || id;
        return acc;
      }, {});
      dataset?.content?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.content?.matrices],
  );

  const labelAcronyms = useMemo(
    () =>
      {
      const base = atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.acronym?.trim() ? meta.acronym : id;
        return acc;
      }, {});
      dataset?.content?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.content?.matrices],
  );

  const activeLabelIds = useMemo(() => {
    if (atlas.order.length === 0) return matrixOrderIds;

    const baseIds = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    if (!useMatrixHierarchyOrder) return baseIds;
    if (!stateAtlasDefinition?.rois?.length) return baseIds;
    if (atlas.colorFields.length === 0) return baseIds;

    const hierarchyLayout = buildCircularHierarchyLayout({
      labelIds: baseIds,
      radius: 1,
      atlasDefinition: stateAtlasDefinition,
      hierarchyFields: atlas.colorFields,
      categoryOrder: atlas.matrixHierarchyCategoryOrder,
    });

    if (hierarchyLayout.length === 0) return baseIds;

    return [...hierarchyLayout]
      .sort((a, b) => a.order - b.order)
      .map((item) => item.labelId);
  }, [
    atlas.labelsById,
    atlas.colorFields,
    atlas.order,
    atlas.matrixHierarchyCategoryOrder,
    stateAtlasDefinition,
    matrixOrderIds,
    useMatrixHierarchyOrder,
  ]);

  const nodeColors = useMemo(
    () => {
      const baseColors = buildRoiGroupingColorById({
        atlasDefinition: stateAtlasDefinition,
        groupingFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      });
      if (atlas.colorFields.length === 0) return baseColors;

      const categories = buildRoiGroupingColorCategories({
        atlasDefinition: stateAtlasDefinition,
        groupingFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      });
      const colorByCategory = new Map(
        categories.map((category) => [category.key, category.color]),
      );

      dataset?.content?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          const values = atlas.colorFields.map((field) => group.criteria[field] ?? "Unknown");
          const color = colorByCategory.get(buildGroupingColorCategoryKey(values));
          if (color) baseColors[group.id] = color;
        });
      });

      return baseColors;
    },
    [
      atlas.colorFields,
      atlas.colorPalette,
      stateAtlasDefinition,
      dataset?.content?.matrices,
    ],
  );

  return {
    matrixOrderIds,
    activeLabelIds,
    labelNames,
    labelTitles,
    labelAcronyms,
    nodeColors,
  };
};
