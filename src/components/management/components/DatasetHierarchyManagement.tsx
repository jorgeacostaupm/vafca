import { Divider } from "antd";
import type { AtlasState } from "@/types/atlas";
import type { CircularHierarchyLayoutPoint } from "@/types/circular";
import type { CategoryOrderEditor, CategoryOrderMap } from "@/components/management/types";
import { moveField, reverseValues } from "@/components/management/utils/hierarchyOrder";
import HierarchySection from "@/components/management/components/HierarchySection";
import CircularHierarchyPreview from "@/components/management/components/CircularHierarchyPreview";
import MatrixHierarchyPreview from "@/components/management/components/MatrixHierarchyPreview";

type DatasetHierarchyManagementProps = {
  atlas: AtlasState;
  activeRoiCount: number;
  previewRadius: number;
  circularPreviewLayout: CircularHierarchyLayoutPoint[];
  matrixPreviewIds: string[];
  previewNodeColors: Record<string, string>;
  selectableCircularHierarchyFields: string[];
  selectableMatrixHierarchyFields: string[];
  circularCategoryOrderEditors: CategoryOrderEditor[];
  matrixCategoryOrderEditors: CategoryOrderEditor[];
  onSetCircularHierarchyFields: (fields: string[]) => void;
  onSetMatrixHierarchyFields: (fields: string[]) => void;
  onSetCircularCategoryOrder: (order: CategoryOrderMap) => void;
  onSetMatrixCategoryOrder: (order: CategoryOrderMap) => void;
};

function DatasetHierarchyManagement({
  atlas,
  activeRoiCount,
  previewRadius,
  circularPreviewLayout,
  matrixPreviewIds,
  previewNodeColors,
  selectableCircularHierarchyFields,
  selectableMatrixHierarchyFields,
  circularCategoryOrderEditors,
  matrixCategoryOrderEditors,
  onSetCircularHierarchyFields,
  onSetMatrixHierarchyFields,
  onSetCircularCategoryOrder,
  onSetMatrixCategoryOrder,
}: DatasetHierarchyManagementProps) {
  return (
    <>
      <Divider style={{ margin: "8px 0" }} />

      <HierarchySection
        title="Circular hierarchy (global)"
        description="Order the atlas fields to define how circular nodes are grouped."
        addFieldPlaceholder="Add hierarchy field"
        emptyHierarchyMessage="No hierarchy fields selected. Circular layout uses a uniform order."
        hierarchyFields={atlas.circularHierarchyFields}
        selectableFields={selectableCircularHierarchyFields}
        categoryOrderEditors={circularCategoryOrderEditors}
        categoryOrder={atlas.circularHierarchyCategoryOrder}
        onMoveField={(field, direction) =>
          onSetCircularHierarchyFields(
            moveField(atlas.circularHierarchyFields, field, direction),
          )
        }
        onRemoveField={(field) =>
          onSetCircularHierarchyFields(
            atlas.circularHierarchyFields.filter((value) => value !== field),
          )
        }
        onAddField={(field) =>
          onSetCircularHierarchyFields([...atlas.circularHierarchyFields, field])
        }
        onReverseFieldOrder={() =>
          onSetCircularHierarchyFields(reverseValues(atlas.circularHierarchyFields))
        }
        onUpdateCategoryOrder={onSetCircularCategoryOrder}
        resolveParentField={(index) => atlas.circularHierarchyFields[index] ?? ""}
        preview={
          <CircularHierarchyPreview
            layout={circularPreviewLayout}
            activeRoiCount={activeRoiCount}
            previewRadius={previewRadius}
            nodeColors={previewNodeColors}
          />
        }
      />

      <Divider style={{ margin: "8px 0" }} />

      <HierarchySection
        title="Matrix node order (X axis)"
        description="Configure matrix node order using the same circular hierarchy logic."
        addFieldPlaceholder="Add matrix hierarchy field"
        emptyHierarchyMessage="No hierarchy fields selected. Matrix order uses the default node order."
        hierarchyFields={atlas.matrixHierarchyFields}
        selectableFields={selectableMatrixHierarchyFields}
        categoryOrderEditors={matrixCategoryOrderEditors}
        categoryOrder={atlas.matrixHierarchyCategoryOrder}
        onMoveField={(field, direction) =>
          onSetMatrixHierarchyFields(
            moveField(atlas.matrixHierarchyFields, field, direction),
          )
        }
        onRemoveField={(field) =>
          onSetMatrixHierarchyFields(
            atlas.matrixHierarchyFields.filter((value) => value !== field),
          )
        }
        onAddField={(field) =>
          onSetMatrixHierarchyFields([...atlas.matrixHierarchyFields, field])
        }
        onReverseFieldOrder={() =>
          onSetMatrixHierarchyFields(reverseValues(atlas.matrixHierarchyFields))
        }
        onUpdateCategoryOrder={onSetMatrixCategoryOrder}
        resolveParentField={(index) => atlas.matrixHierarchyFields[index] ?? ""}
        preview={
          <MatrixHierarchyPreview
            matrixPreviewIds={matrixPreviewIds}
            activeRoiCount={activeRoiCount}
            nodeColors={previewNodeColors}
          />
        }
      />
    </>
  );
}

export default DatasetHierarchyManagement;
