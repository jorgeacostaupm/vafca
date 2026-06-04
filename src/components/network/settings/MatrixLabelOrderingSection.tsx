import { Alert, Button, Space } from "antd";
import { useMemo, useState } from "react";

import HierarchyCategoryOrderSection from "@/components/management/components/HierarchyCategoryOrderSection";
import MatrixHierarchyPreview from "@/components/management/components/MatrixHierarchyPreview";
import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import type { CategoryOrderMap } from "@/components/management/types";
import {
  areCategoryOrdersEqual,
  toCleanCategoryOrderMap,
} from "@/components/management/utils/hierarchyOrder";
import {
  MATRIX_HIERARCHY_PREVIEW_HEIGHT,
  MATRIX_HIERARCHY_PREVIEW_WIDTH,
} from "@/config/ui";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setMatrixHierarchyCategoryOrder } from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

import SettingsSection from "./SettingsSection";

type MatrixLabelOrderingDraft = {
  baseCategoryOrder: CategoryOrderMap;
  categoryOrder: CategoryOrderMap;
};

export default function MatrixLabelOrderingSection() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));
  const [draft, setDraft] = useState<MatrixLabelOrderingDraft>(() => ({
    baseCategoryOrder: atlas.matrixHierarchyCategoryOrder,
    categoryOrder: atlas.matrixHierarchyCategoryOrder,
  }));
  const appliedStateChanged = !areCategoryOrdersEqual(
    draft.baseCategoryOrder,
    atlas.matrixHierarchyCategoryOrder,
  );
  const draftCategoryOrder = appliedStateChanged
    ? atlas.matrixHierarchyCategoryOrder
    : draft.categoryOrder;

  const draftAtlas = useMemo(
    () => ({
      ...atlas,
      matrixHierarchyCategoryOrder: draftCategoryOrder,
    }),
    [atlas, draftCategoryOrder],
  );
  const hierarchy = useManagementHierarchy({
    atlas: draftAtlas,
    atlasDefinition,
    syncCategoryOrder: false,
  });
  const hasPendingChanges = !areCategoryOrdersEqual(
    atlas.matrixHierarchyCategoryOrder,
    draftCategoryOrder,
  );

  const handleReset = () => {
    setDraft({
      baseCategoryOrder: atlas.matrixHierarchyCategoryOrder,
      categoryOrder: atlas.matrixHierarchyCategoryOrder,
    });
  };

  const handleApply = () => {
    dispatch(
      setMatrixHierarchyCategoryOrder(
        toCleanCategoryOrderMap(hierarchy.matrixCategoryOrderEditors),
      ),
    );
  };

  const handleUpdateCategoryOrder = (nextCategoryOrder: CategoryOrderMap) => {
    setDraft({
      baseCategoryOrder: atlas.matrixHierarchyCategoryOrder,
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
        <Alert type="info" message="Load a dataset to configure matrix label ordering." />
      ) : (
        <div className="matrix-label-ordering">
          <div className="matrix-label-ordering__preview">
            <MatrixHierarchyPreview
              matrixPreviewIds={hierarchy.matrixPreviewIds}
              activeRoiCount={hierarchy.activeRoiIds.length}
              nodeColors={hierarchy.previewNodeColors}
              displayWidth={MATRIX_HIERARCHY_PREVIEW_WIDTH}
              displayHeight={MATRIX_HIERARCHY_PREVIEW_HEIGHT}
            />
          </div>
          <div className="matrix-label-ordering__form">
            <HierarchyCategoryOrderSection
              categoryOrderEditors={hierarchy.matrixCategoryOrderEditors}
              categoryOrder={draftCategoryOrder}
              onUpdateCategoryOrder={handleUpdateCategoryOrder}
              resolveParentField={(index) => atlas.colorFields[index] ?? ""}
            />
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
