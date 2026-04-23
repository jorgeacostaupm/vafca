import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import { buildAtlasRoiColorById } from "@/utils/atlas/coloring";
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
    [atlas.labelsById, atlas.order, matrixOrderEntries],
  );

  const labelTitles = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.label ?? id;
        return acc;
      }, {}),
    [atlas.labelsById, atlas.order],
  );

  const labelAcronyms = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.acronym?.trim() ? meta.acronym : id;
        return acc;
      }, {}),
    [atlas.labelsById, atlas.order],
  );

  const activeLabelIds = useMemo(() => {
    if (atlas.order.length === 0) return matrixOrderIds;

    const baseIds = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    if (!useMatrixHierarchyOrder) return baseIds;
    if (!atlasDefinition?.rois?.length) return baseIds;
    if (atlas.matrixHierarchyFields.length === 0) return baseIds;

    const hierarchyLayout = buildCircularHierarchyLayout({
      labelIds: baseIds,
      radius: 1,
      atlasDefinition,
      hierarchyFields: atlas.matrixHierarchyFields,
      categoryOrder: atlas.matrixHierarchyCategoryOrder,
    });

    if (hierarchyLayout.length === 0) return baseIds;

    return [...hierarchyLayout]
      .sort((a, b) => a.order - b.order)
      .map((item) => item.labelId);
  }, [
    atlas.labelsById,
    atlas.matrixHierarchyCategoryOrder,
    atlas.matrixHierarchyFields,
    atlas.order,
    atlasDefinition,
    matrixOrderIds,
    useMatrixHierarchyOrder,
  ]);

  const nodeColors = useMemo(
    () =>
      buildAtlasRoiColorById({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      }),
    [atlas.colorFields, atlas.colorPalette, atlasDefinition],
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
