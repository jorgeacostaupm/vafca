import { useEffect, useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import type { AtlasDefinition, AtlasState } from "@/types/atlas";
import { buildAtlasRoiColorById } from "@/utils/atlas/coloring";
import { getCommonRoiFields } from "@/utils/atlas/atlasDefinition";
import { buildCircularHierarchyLayout } from "@/utils/circular/hierarchy";
import {
  setAtlasColorFields,
  setCircularHierarchyCategoryOrder,
  setMatrixHierarchyCategoryOrder,
} from "@/store/slices/atlas";
import { PREVIEW_PADDING, PREVIEW_SIZE } from "@/components/management/constants";
import {
  areCategoryOrdersEqual,
  buildCategoryOrderEditors,
  toCleanCategoryOrderMap,
} from "@/components/management/utils/hierarchyOrder";

type UseManagementHierarchyArgs = {
  atlas: AtlasState;
  atlasDefinition: AtlasDefinition | null;
};

export const useManagementHierarchy = ({
  atlas,
  atlasDefinition,
}: UseManagementHierarchyArgs) => {
  const dispatch = useAppDispatch();

  const availableHierarchyFields = useMemo(
    () => getCommonRoiFields(atlasDefinition),
    [atlasDefinition],
  );

  const activeRoiIds = useMemo(() => {
    const enabled = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    return enabled.length > 0 ? enabled : atlas.order;
  }, [atlas.labelsById, atlas.order]);

  const previewRadius = PREVIEW_SIZE / 2 - PREVIEW_PADDING;

  const circularPreviewLayout = useMemo(
    () =>
      buildCircularHierarchyLayout({
        labelIds: activeRoiIds.slice(0, 220),
        radius: previewRadius,
        atlasDefinition,
        hierarchyFields: atlas.colorFields,
        categoryOrder: atlas.circularHierarchyCategoryOrder,
      }),
    [
      activeRoiIds,
      previewRadius,
      atlasDefinition,
      atlas.colorFields,
      atlas.circularHierarchyCategoryOrder,
    ],
  );

  const matrixPreviewLayout = useMemo(
    () =>
      buildCircularHierarchyLayout({
        labelIds: activeRoiIds.slice(0, 220),
        radius: 1,
        atlasDefinition,
        hierarchyFields: atlas.colorFields,
        categoryOrder: atlas.matrixHierarchyCategoryOrder,
      }),
    [
      activeRoiIds,
      atlasDefinition,
      atlas.colorFields,
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
      buildAtlasRoiColorById({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      }),
    [atlasDefinition, atlas.colorFields, atlas.colorPalette],
  );

  const circularCategoryOrderEditors = useMemo(
    () =>
      buildCategoryOrderEditors({
        atlasDefinition,
        hierarchyFields: atlas.colorFields,
        categoryOrder: atlas.circularHierarchyCategoryOrder,
        sourceIds: activeRoiIds,
      }),
    [
      atlasDefinition,
      atlas.colorFields,
      atlas.circularHierarchyCategoryOrder,
      activeRoiIds,
    ],
  );

  const matrixCategoryOrderEditors = useMemo(
    () =>
      buildCategoryOrderEditors({
        atlasDefinition,
        hierarchyFields: atlas.colorFields,
        categoryOrder: atlas.matrixHierarchyCategoryOrder,
        sourceIds: activeRoiIds,
      }),
    [
      atlasDefinition,
      atlas.colorFields,
      atlas.matrixHierarchyCategoryOrder,
      activeRoiIds,
    ],
  );

  useEffect(() => {
    if (!atlasDefinition?.rois?.length) return;
    const valid = atlas.colorFields.filter((field) =>
      availableHierarchyFields.includes(field),
    );
    if (valid.length !== atlas.colorFields.length) {
      dispatch(setAtlasColorFields(valid));
    }
  }, [atlasDefinition, availableHierarchyFields, atlas.colorFields, dispatch]);

  useEffect(() => {
    const cleaned = toCleanCategoryOrderMap(circularCategoryOrderEditors);
    if (!areCategoryOrdersEqual(atlas.circularHierarchyCategoryOrder, cleaned)) {
      dispatch(setCircularHierarchyCategoryOrder(cleaned));
    }
  }, [circularCategoryOrderEditors, atlas.circularHierarchyCategoryOrder, dispatch]);

  useEffect(() => {
    const cleaned = toCleanCategoryOrderMap(matrixCategoryOrderEditors);
    if (!areCategoryOrdersEqual(atlas.matrixHierarchyCategoryOrder, cleaned)) {
      dispatch(setMatrixHierarchyCategoryOrder(cleaned));
    }
  }, [matrixCategoryOrderEditors, atlas.matrixHierarchyCategoryOrder, dispatch]);

  return {
    activeRoiIds,
    previewRadius,
    circularPreviewLayout,
    matrixPreviewIds,
    previewNodeColors,
    circularCategoryOrderEditors,
    matrixCategoryOrderEditors,
  };
};
