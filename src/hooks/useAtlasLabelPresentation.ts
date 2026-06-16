import { useMemo } from "react";

import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import type { AtlasDefinition } from "@/types/atlas";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import {
  getDatasetAtlasId,
  getDatasetAtlasLabel,
  getDatasetNodeOrder,
} from "@/utils/datasetAccessors";
import {
  buildGroupingColorCategoryKey,
  buildNodeGroupingColorById,
  buildNodeGroupingColorCategories,
} from "@/utils/groupingColoring";
import { buildLabelNameMap, normalizeNodeOrder } from "@/utils/nodeOrder";

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
      nodes: atlas.order.map((id, index) => {
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

  const nodeOrderEntries = useMemo(
    () => normalizeNodeOrder(getDatasetNodeOrder(dataset)),
    [dataset],
  );

  const nodeOrderIds = useMemo(
    () => nodeOrderEntries.map((entry) => entry.id),
    [nodeOrderEntries],
  );

  const labelNames = useMemo(
    () => {
      const base =
        atlas.order.length === 0
          ? buildLabelNameMap(nodeOrderEntries)
          : atlas.order.reduce<Record<string, string>>((acc, id) => {
            const label = atlas.labelsById[id];
            const acronym = label?.acronym?.trim();
            const name = label?.label?.trim();
            acc[id] = acronym ?? name ?? id;
            return acc;
          }, {});

      dataset?.content?.networks.forEach((network) => {
        if (network.derivation?.type !== "aggregation") return;
        network.derivation.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.content?.networks, nodeOrderEntries],
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
      dataset?.content?.networks.forEach((network) => {
        if (network.derivation?.type !== "aggregation") return;
        network.derivation.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.content?.networks],
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
      dataset?.content?.networks.forEach((network) => {
        if (network.derivation?.type !== "aggregation") return;
        network.derivation.groups.forEach((group) => {
          base[group.id] = group.label;
        });
      });
      return base;
    },
    [atlas.labelsById, atlas.order, dataset?.content?.networks],
  );

  const activeLabelIds = useMemo(() => {
    if (atlas.order.length === 0) return nodeOrderIds;

    const baseIds = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    if (!useMatrixHierarchyOrder) return baseIds;
    if (!stateAtlasDefinition?.nodes?.length) return baseIds;
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
    nodeOrderIds,
    useMatrixHierarchyOrder,
  ]);

  const nodeColors = useMemo(
    () => {
      const baseColors = buildNodeGroupingColorById({
        atlasDefinition: stateAtlasDefinition,
        groupingFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      });
      if (atlas.colorFields.length === 0) return baseColors;

      const categories = buildNodeGroupingColorCategories({
        atlasDefinition: stateAtlasDefinition,
        groupingFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      });
      const colorByCategory = new Map(
        categories.map((category) => [category.key, category.color]),
      );

      dataset?.content?.networks.forEach((network) => {
        if (network.derivation?.type !== "aggregation") return;
        network.derivation.groups.forEach((group) => {
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
      dataset?.content?.networks,
    ],
  );

  return {
    nodeOrderIds,
    activeLabelIds,
    labelNames,
    labelTitles,
    labelAcronyms,
    nodeColors,
  };
};
