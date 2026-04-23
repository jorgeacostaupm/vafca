import { Divider } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setCircularHierarchyCategoryOrder,
  setCircularHierarchyFields,
  setMatrixHierarchyCategoryOrder,
  setMatrixHierarchyFields,
} from "@/store/slices/atlas";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import { moveField, reverseValues } from "@/components/management/utils/hierarchyOrder";
import HierarchySection from "@/components/management/components/HierarchySection";
import CircularHierarchyPreview from "@/components/management/components/CircularHierarchyPreview";
import MatrixHierarchyPreview from "@/components/management/components/MatrixHierarchyPreview";

function DatasetHierarchyManagement() {
  const dispatch = useAppDispatch();
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);

  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );
  const {
    activeRoiIds,
    previewRadius,
    circularPreviewLayout,
    matrixPreviewIds,
    previewNodeColors,
    selectableCircularHierarchyFields,
    selectableMatrixHierarchyFields,
    circularCategoryOrderEditors,
    matrixCategoryOrderEditors,
  } = useManagementHierarchy({
    atlas,
    atlasDefinition,
  });

  if (!dataset) return null;

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
          dispatch(
            setCircularHierarchyFields(
              moveField(atlas.circularHierarchyFields, field, direction),
            ),
          )
        }
        onRemoveField={(field) =>
          dispatch(
            setCircularHierarchyFields(
              atlas.circularHierarchyFields.filter((value) => value !== field),
            ),
          )
        }
        onAddField={(field) =>
          dispatch(
            setCircularHierarchyFields([...atlas.circularHierarchyFields, field]),
          )
        }
        onReverseFieldOrder={() =>
          dispatch(
            setCircularHierarchyFields(reverseValues(atlas.circularHierarchyFields)),
          )
        }
        onUpdateCategoryOrder={(next) =>
          dispatch(setCircularHierarchyCategoryOrder(next))
        }
        resolveParentField={(index) => atlas.circularHierarchyFields[index] ?? ""}
        preview={
          <CircularHierarchyPreview
            layout={circularPreviewLayout}
            activeRoiCount={activeRoiIds.length}
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
          dispatch(
            setMatrixHierarchyFields(
              moveField(atlas.matrixHierarchyFields, field, direction),
            ),
          )
        }
        onRemoveField={(field) =>
          dispatch(
            setMatrixHierarchyFields(
              atlas.matrixHierarchyFields.filter((value) => value !== field),
            ),
          )
        }
        onAddField={(field) =>
          dispatch(setMatrixHierarchyFields([...atlas.matrixHierarchyFields, field]))
        }
        onReverseFieldOrder={() =>
          dispatch(setMatrixHierarchyFields(reverseValues(atlas.matrixHierarchyFields)))
        }
        onUpdateCategoryOrder={(next) =>
          dispatch(setMatrixHierarchyCategoryOrder(next))
        }
        resolveParentField={(index) => atlas.matrixHierarchyFields[index] ?? ""}
        preview={
          <MatrixHierarchyPreview
            matrixPreviewIds={matrixPreviewIds}
            activeRoiCount={activeRoiIds.length}
            nodeColors={previewNodeColors}
          />
        }
      />
    </>
  );
}

export default DatasetHierarchyManagement;
