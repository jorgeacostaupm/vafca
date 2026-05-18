import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import {
  buildAtlasColorCategories,
  buildAtlasColorCategoryKey,
  buildAtlasRoiColorById,
} from "@/utils/atlas/coloring";
import { buildLabelNameMap, normalizeMatrixOrder } from "@/utils/matrixOrder";

type UseAtlasLabelPresentationArgs = {
  useMatrixHierarchyOrder?: boolean;
};

export const useAtlasLabelPresentation = ({
  useMatrixHierarchyOrder = false,
}: UseAtlasLabelPresentationArgs = {}) => {
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);

  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );

  const matrixOrderEntries = useMemo(
    () => normalizeMatrixOrder(dataset?.metadata.matrixOrder),
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

      dataset?.connectivity?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.connectivity?.matrices, matrixOrderEntries],
  );

  const labelTitles = useMemo(
    () =>
      {
      const base = atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.label ?? id;
        return acc;
      }, {});
      dataset?.connectivity?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.connectivity?.matrices],
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
      dataset?.connectivity?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.connectivity?.matrices],
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
  }, [
    atlas.labelsById,
    atlas.colorFields,
    atlas.order,
    atlas.matrixHierarchyCategoryOrder,
    atlasDefinition,
    matrixOrderIds,
    useMatrixHierarchyOrder,
  ]);

  const nodeColors = useMemo(
    () => {
      const baseColors = buildAtlasRoiColorById({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      });
      if (atlas.colorFields.length === 0) return baseColors;

      const categories = buildAtlasColorCategories({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      });
      const colorByCategory = new Map(
        categories.map((category) => [category.key, category.color]),
      );

      dataset?.connectivity?.matrices.forEach((matrix) => {
        matrix.reduction?.groups.forEach((group) => {
          const values = atlas.colorFields.map((field) => group.criteria[field] ?? "Unknown");
          const color = colorByCategory.get(buildAtlasColorCategoryKey(values));
          if (color) baseColors[group.id] = color;
        });
      });

      return baseColors;
    },
    [
      atlas.colorFields,
      atlas.colorPalette,
      atlasDefinition,
      dataset?.connectivity?.matrices,
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
