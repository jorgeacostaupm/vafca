import { useEffect, useMemo } from "react";

import { PREVIEW_PADDING, PREVIEW_SIZE } from "@/components/management/constants";
import {
  areCategoryOrdersEqual,
  buildCategoryOrderEditors,
  toCleanCategoryOrderMap,
} from "@/components/management/utils/hierarchyOrder";
import { CIRCULAR_PREVIEW_FAKE_LINK_DENSITY } from "@/config/ui";
import { useAppDispatch } from "@/store/hooks";
import {
  setAtlasColorFields,
  setCircularHierarchyCategoryOrder,
  setMatrixHierarchyCategoryOrder,
} from "@/store/slices/atlasUi";
import type { AtlasDefinition, AtlasState } from "@/types/atlas";
import type { CircularPreviewLink } from "@/types/circular";
import { getCommonNodeFields } from "@/utils/atlas/atlasDefinition";
import {
  buildCircularHierarchyBundleLayout,
  buildCircularHierarchyLayout,
} from "@/utils/circular/hierarchy";
import { buildNodeGroupingColorById } from "@/utils/groupingColoring";

type UseManagementHierarchyArgs = {
  atlas: AtlasState;
  atlasDefinition: AtlasDefinition | null;
  previewColorFields?: string[];
  previewColorPalette?: AtlasState["colorPalette"];
  syncCategoryOrder?: boolean;
};

const hashPreviewPair = (sourceIndex: number, targetIndex: number) => {
  const value = (sourceIndex + 1) * 73_856_093 + (targetIndex + 1) * 19_349_663;
  return Math.abs(Math.sin(value) * 10_000) % 1;
};

const buildPreviewLinks = (
  labelIds: string[],
  pathByLabelPair: (
    sourceLabelId: string,
    targetLabelId: string,
  ) => CircularPreviewLink["path"] | null,
): CircularPreviewLink[] => {
  const count = labelIds.length;
  if (count < 2) return [];

  const links: CircularPreviewLink[] = [];
  for (let sourceIndex = 0; sourceIndex < count - 1; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < count; targetIndex += 1) {
      if (
        hashPreviewPair(sourceIndex, targetIndex) >
        CIRCULAR_PREVIEW_FAKE_LINK_DENSITY
      ) {
        continue;
      }

      const sourceLabelId = labelIds[sourceIndex];
      const targetLabelId = labelIds[targetIndex];
      links.push({
        id: `${sourceLabelId}::${targetLabelId}`,
        sourceLabelId,
        targetLabelId,
        path: pathByLabelPair(sourceLabelId, targetLabelId) ?? undefined,
      });
    }
  }

  return links;
};

export const useManagementHierarchy = ({
  atlas,
  atlasDefinition,
  previewColorFields,
  previewColorPalette,
  syncCategoryOrder = true,
}: UseManagementHierarchyArgs) => {
  const dispatch = useAppDispatch();
  const hierarchyFields = previewColorFields ?? atlas.colorFields;
  const colorPalette = previewColorPalette ?? atlas.colorPalette;

  const availableHierarchyFields = useMemo(
    () => getCommonNodeFields(atlasDefinition),
    [atlasDefinition],
  );

  const activeNodeIds = useMemo(() => {
    const enabled = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    return enabled.length > 0 ? enabled : atlas.order;
  }, [atlas.labelsById, atlas.order]);

  const previewRadius = PREVIEW_SIZE / 2 - PREVIEW_PADDING;

  const circularPreviewBundleLayout = useMemo(
    () =>
      buildCircularHierarchyBundleLayout({
        labelIds: activeNodeIds.slice(0, 220),
        radius: previewRadius,
        atlasDefinition,
        hierarchyFields,
        categoryOrder: atlas.circularHierarchyCategoryOrder,
      }),
    [
      activeNodeIds,
      previewRadius,
      atlasDefinition,
      hierarchyFields,
      atlas.circularHierarchyCategoryOrder,
    ],
  );
  const circularPreviewLayout = circularPreviewBundleLayout.points;
  const circularPreviewLinks = useMemo(
    () =>
      buildPreviewLinks(
        [...circularPreviewLayout]
          .sort((a, b) => a.order - b.order)
          .map((item) => item.labelId),
        circularPreviewBundleLayout.pathByLabelPair,
      ),
    [circularPreviewLayout, circularPreviewBundleLayout],
  );

  const matrixPreviewLayout = useMemo(
    () =>
      buildCircularHierarchyLayout({
        labelIds: activeNodeIds.slice(0, 220),
        radius: 1,
        atlasDefinition,
        hierarchyFields,
        categoryOrder: atlas.matrixHierarchyCategoryOrder,
      }),
    [
      activeNodeIds,
      atlasDefinition,
      hierarchyFields,
      atlas.matrixHierarchyCategoryOrder,
    ],
  );

  const matrixPreviewIds = useMemo(
    () =>
      [...matrixPreviewLayout]
        .sort((a, b) => a.order - b.order)
        .map((entry) => entry.labelId),
    [matrixPreviewLayout],
  );

  const previewNodeColors = useMemo(
    () =>
      buildNodeGroupingColorById({
        atlasDefinition,
        groupingFields: hierarchyFields,
        colorPalette,
      }),
    [atlasDefinition, hierarchyFields, colorPalette],
  );

  const circularCategoryOrderEditors = useMemo(
    () =>
      buildCategoryOrderEditors({
        atlasDefinition,
        hierarchyFields,
        categoryOrder: atlas.circularHierarchyCategoryOrder,
        sourceIds: activeNodeIds,
      }),
    [
      atlasDefinition,
      hierarchyFields,
      atlas.circularHierarchyCategoryOrder,
      activeNodeIds,
    ],
  );

  const matrixCategoryOrderEditors = useMemo(
    () =>
      buildCategoryOrderEditors({
        atlasDefinition,
        hierarchyFields,
        categoryOrder: atlas.matrixHierarchyCategoryOrder,
        sourceIds: activeNodeIds,
      }),
    [
      atlasDefinition,
      hierarchyFields,
      atlas.matrixHierarchyCategoryOrder,
      activeNodeIds,
    ],
  );

  useEffect(() => {
    if (!syncCategoryOrder) return;
    if (!atlasDefinition?.nodes?.length) return;
    const valid = atlas.colorFields.filter((field) =>
      availableHierarchyFields.includes(field),
    );
    if (valid.length !== atlas.colorFields.length) {
      dispatch(setAtlasColorFields(valid));
    }
  }, [atlasDefinition, availableHierarchyFields, atlas.colorFields, dispatch, syncCategoryOrder]);

  useEffect(() => {
    if (!syncCategoryOrder) return;
    const cleaned = toCleanCategoryOrderMap(circularCategoryOrderEditors);
    if (!areCategoryOrdersEqual(atlas.circularHierarchyCategoryOrder, cleaned)) {
      dispatch(setCircularHierarchyCategoryOrder(cleaned));
    }
  }, [
    circularCategoryOrderEditors,
    atlas.circularHierarchyCategoryOrder,
    dispatch,
    syncCategoryOrder,
  ]);

  useEffect(() => {
    if (!syncCategoryOrder) return;
    const cleaned = toCleanCategoryOrderMap(matrixCategoryOrderEditors);
    if (!areCategoryOrdersEqual(atlas.matrixHierarchyCategoryOrder, cleaned)) {
      dispatch(setMatrixHierarchyCategoryOrder(cleaned));
    }
  }, [
    matrixCategoryOrderEditors,
    atlas.matrixHierarchyCategoryOrder,
    dispatch,
    syncCategoryOrder,
  ]);

  return {
    activeNodeIds,
    previewRadius,
    circularPreviewLayout,
    circularPreviewLinks,
    matrixPreviewIds,
    previewNodeColors,
    circularCategoryOrderEditors,
    matrixCategoryOrderEditors,
  };
};
