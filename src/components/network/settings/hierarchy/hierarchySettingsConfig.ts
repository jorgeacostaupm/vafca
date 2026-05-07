import type {
  HierarchySettingsConfig,
  HierarchySettingsConfigArgs,
} from "./hierarchySettingsTypes";

export const CIRCULAR_PREVIEW_WIDTH = 390;
export const MATRIX_PREVIEW_WIDTH = 520;
export const MATRIX_PREVIEW_HEIGHT = 150;

export const getHierarchySettingsConfig = ({
  mode,
  atlas,
  hierarchy,
}: HierarchySettingsConfigArgs): HierarchySettingsConfig => {
  if (mode === "circular") {
    return {
      mode,
      configurationLabel: "Circular configuration",
      description: "Order atlas fields to define how circular nodes are grouped.",
      addFieldPlaceholder: "Add hierarchy field",
      emptyHierarchyMessage:
        "No hierarchy fields selected. Circular layout uses a uniform order.",
      hierarchyFields: atlas.circularHierarchyFields,
      selectableFields: hierarchy.selectableCircularHierarchyFields,
      categoryOrderEditors: hierarchy.circularCategoryOrderEditors,
      categoryOrder: atlas.circularHierarchyCategoryOrder,
    };
  }

  return {
    mode,
    configurationLabel: "Matrix configuration",
    description: "Configure matrix label order using the same hierarchy logic.",
    addFieldPlaceholder: "Add matrix hierarchy field",
    emptyHierarchyMessage:
      "No hierarchy fields selected. Matrix order uses the default node order.",
    hierarchyFields: atlas.matrixHierarchyFields,
    selectableFields: hierarchy.selectableMatrixHierarchyFields,
    categoryOrderEditors: hierarchy.matrixCategoryOrderEditors,
    categoryOrder: atlas.matrixHierarchyCategoryOrder,
  };
};
