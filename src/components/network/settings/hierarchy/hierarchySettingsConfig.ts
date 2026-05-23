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
  const base = {
    mode,
    configurationLabel: "Category order",
    description:
      "Fields come from Grouping. Configure category order for this view.",
    addFieldPlaceholder: "Add tag field in Grouping",
    emptyHierarchyMessage:
      "No grouping fields selected. Add grouping fields first.",
    hierarchyFields: atlas.colorFields,
    selectableFields: [],
  };

  if (mode === "circular") {
    return {
      ...base,
      configurationLabel: "Circular order",
      categoryOrderEditors: hierarchy.circularCategoryOrderEditors,
      categoryOrder: atlas.circularHierarchyCategoryOrder,
    };
  }

  return {
    ...base,
    configurationLabel: "Matrix order",
    categoryOrderEditors: hierarchy.matrixCategoryOrderEditors,
    categoryOrder: atlas.matrixHierarchyCategoryOrder,
  };
};
