import { Alert, Button, Space } from "antd";
import { useMemo, useState } from "react";

import HierarchyCategoryOrderSection from "@/components/management/components/HierarchyCategoryOrderSection";
import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import type { CategoryOrderMap } from "@/components/management/types";
import {
  areCategoryOrdersEqual,
  toCleanCategoryOrderMap,
} from "@/components/management/utils/hierarchyOrder";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCircularHierarchyCategoryOrder } from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

import SettingsSection from "./SettingsSection";

type CircularLabelOrderingDraft = {
  baseCategoryOrder: CategoryOrderMap;
  categoryOrder: CategoryOrderMap;
};

export default function CircularLabelOrderingSection() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));
  const [draft, setDraft] = useState<CircularLabelOrderingDraft>(() => ({
    baseCategoryOrder: atlas.circularHierarchyCategoryOrder,
    categoryOrder: atlas.circularHierarchyCategoryOrder,
  }));
  const appliedStateChanged = !areCategoryOrdersEqual(
    draft.baseCategoryOrder,
    atlas.circularHierarchyCategoryOrder,
  );
  const draftCategoryOrder = appliedStateChanged
    ? atlas.circularHierarchyCategoryOrder
    : draft.categoryOrder;
  const draftAtlas = useMemo(
    () => ({
      ...atlas,
      circularHierarchyCategoryOrder: draftCategoryOrder,
    }),
    [atlas, draftCategoryOrder],
  );
  const hierarchy = useManagementHierarchy({
    atlas: draftAtlas,
    atlasDefinition,
    syncCategoryOrder: false,
  });
  const hasPendingChanges = !areCategoryOrdersEqual(
    atlas.circularHierarchyCategoryOrder,
    draftCategoryOrder,
  );

  const handleReset = () => {
    setDraft({
      baseCategoryOrder: atlas.circularHierarchyCategoryOrder,
      categoryOrder: atlas.circularHierarchyCategoryOrder,
    });
  };

  const handleApply = () => {
    dispatch(
      setCircularHierarchyCategoryOrder(
        toCleanCategoryOrderMap(hierarchy.circularCategoryOrderEditors),
      ),
    );
  };

  const handleUpdateCategoryOrder = (nextCategoryOrder: CategoryOrderMap) => {
    setDraft({
      baseCategoryOrder: atlas.circularHierarchyCategoryOrder,
      categoryOrder: nextCategoryOrder,
    });
  };

  return (
    <SettingsSection
      title="Label Ordering"
      actions={
        <Space>
          <Button disabled={!hasPendingChanges} onClick={handleReset}>
            Reset
          </Button>
          <Button type="primary" disabled={!hasPendingChanges} onClick={handleApply}>
            Apply
          </Button>
        </Space>
      }
    >
      {!dataset ? (
        <Alert type="info" message="Load a dataset to configure circular label ordering." />
      ) : (
        <div className="circular-label-ordering__form">
          <HierarchyCategoryOrderSection
            categoryOrderEditors={hierarchy.circularCategoryOrderEditors}
            categoryOrder={draftCategoryOrder}
            onUpdateCategoryOrder={handleUpdateCategoryOrder}
            resolveParentField={(index) => atlas.colorFields[index] ?? ""}
          />
        </div>
      )}
    </SettingsSection>
  );
}
