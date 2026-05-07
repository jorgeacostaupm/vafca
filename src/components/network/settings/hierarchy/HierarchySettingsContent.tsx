import { useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setCircularHierarchyCategoryOrder,
  setCircularHierarchyFields,
  setMatrixHierarchyCategoryOrder,
  setMatrixHierarchyFields,
} from "@/store/slices/atlas";
import type { AtlasState } from "@/types/atlas";
import HierarchyCategoryOrderSection from "@/components/management/components/HierarchyCategoryOrderSection";
import HierarchyConfigurationSection from "@/components/management/components/HierarchyConfigurationSection";
import { moveField, reverseValues } from "@/components/management/utils/hierarchyOrder";
import type { CategoryOrderMap, MoveDirection } from "@/components/management/types";
import { getHierarchySettingsConfig } from "./hierarchySettingsConfig";
import HierarchySettingsFormTabs from "./HierarchySettingsFormTabs";
import HierarchySettingsLayout from "./HierarchySettingsLayout";
import HierarchySettingsPreview from "./HierarchySettingsPreview";
import type {
  HierarchySettingsContentMode,
  HierarchySettingsMode,
  HierarchySettingsModel,
} from "./hierarchySettingsTypes";

type HierarchySettingsContentProps = {
  mode: HierarchySettingsMode;
  atlas: AtlasState;
  hierarchy: HierarchySettingsModel;
};

export default function HierarchySettingsContent({
  mode,
  atlas,
  hierarchy,
}: HierarchySettingsContentProps) {
  const dispatch = useAppDispatch();
  const config = useMemo(
    () => getHierarchySettingsConfig({ mode, atlas, hierarchy }),
    [mode, atlas, hierarchy],
  );

  const setFields = (fields: string[]) => {
    if (mode === "circular") {
      dispatch(setCircularHierarchyFields(fields));
      return;
    }
    dispatch(setMatrixHierarchyFields(fields));
  };

  const setCategoryOrder = (categoryOrder: CategoryOrderMap) => {
    if (mode === "circular") {
      dispatch(setCircularHierarchyCategoryOrder(categoryOrder));
      return;
    }
    dispatch(setMatrixHierarchyCategoryOrder(categoryOrder));
  };

  const handleMoveField = (field: string, direction: MoveDirection) => {
    setFields(moveField(config.hierarchyFields, field, direction));
  };

  const handleRemoveField = (field: string) => {
    setFields(config.hierarchyFields.filter((value) => value !== field));
  };

  const handleAddField = (field: string) => {
    setFields([...config.hierarchyFields, field]);
  };

  const renderSection = (contentMode: HierarchySettingsContentMode) => (
    contentMode === "configuration" ? (
      <HierarchyConfigurationSection
        description={config.description}
        addFieldPlaceholder={config.addFieldPlaceholder}
        emptyHierarchyMessage={config.emptyHierarchyMessage}
        hierarchyFields={config.hierarchyFields}
        selectableFields={config.selectableFields}
        onMoveField={handleMoveField}
        onRemoveField={handleRemoveField}
        onAddField={handleAddField}
        onReverseFieldOrder={() => setFields(reverseValues(config.hierarchyFields))}
      />
    ) : (
      <HierarchyCategoryOrderSection
        categoryOrderEditors={config.categoryOrderEditors}
        categoryOrder={config.categoryOrder}
        onUpdateCategoryOrder={setCategoryOrder}
        resolveParentField={(index) => config.hierarchyFields[index] ?? ""}
      />
    )
  );

  return (
    <HierarchySettingsLayout
      preview={<HierarchySettingsPreview mode={mode} hierarchy={hierarchy} />}
    >
      <HierarchySettingsFormTabs
        configurationLabel={config.configurationLabel}
        renderSection={renderSection}
      />
    </HierarchySettingsLayout>
  );
}
