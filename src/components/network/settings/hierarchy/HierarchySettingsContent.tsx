import { useMemo } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setCircularHierarchyCategoryOrder,
  setMatrixHierarchyCategoryOrder,
} from "@/store/slices/atlasUi";
import type { AtlasState } from "@/types/atlas";
import HierarchyCategoryOrderSection from "@/components/management/components/HierarchyCategoryOrderSection";
import type { CategoryOrderMap } from "@/components/management/types";
import { getHierarchySettingsConfig } from "./hierarchySettingsConfig";
import HierarchySettingsLayout from "./HierarchySettingsLayout";
import HierarchySettingsPreview from "./HierarchySettingsPreview";
import type {
  HierarchySettingsMode,
  HierarchySettingsModel,
} from "./hierarchySettingsTypes";

type HierarchySettingsContentProps = {
  mode: HierarchySettingsMode;
  atlas: AtlasState;
  hierarchy: HierarchySettingsModel;
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
};

export default function HierarchySettingsContent({
  mode,
  atlas,
  hierarchy,
  circularLinkTension,
  circularBundlingEnabled,
}: HierarchySettingsContentProps) {
  const dispatch = useAppDispatch();
  const config = useMemo(
    () => getHierarchySettingsConfig({ mode, atlas, hierarchy }),
    [mode, atlas, hierarchy],
  );

  const setCategoryOrder = (categoryOrder: CategoryOrderMap) => {
    if (mode === "circular") {
      dispatch(setCircularHierarchyCategoryOrder(categoryOrder));
      return;
    }
    dispatch(setMatrixHierarchyCategoryOrder(categoryOrder));
  };

  return (
    <HierarchySettingsLayout
      preview={
        <HierarchySettingsPreview
          mode={mode}
          hierarchy={hierarchy}
          circularLinkTension={circularLinkTension}
          circularBundlingEnabled={circularBundlingEnabled}
        />
      }
    >
      <HierarchyCategoryOrderSection
        categoryOrderEditors={config.categoryOrderEditors}
        categoryOrder={config.categoryOrder}
        onUpdateCategoryOrder={setCategoryOrder}
        resolveParentField={(index) => config.hierarchyFields[index] ?? ""}
      />
    </HierarchySettingsLayout>
  );
}
