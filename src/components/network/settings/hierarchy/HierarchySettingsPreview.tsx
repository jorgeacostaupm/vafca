import CircularHierarchyPreview from "@/components/management/components/CircularHierarchyPreview";
import MatrixHierarchyPreview from "@/components/management/components/MatrixHierarchyPreview";
import {
  CIRCULAR_PREVIEW_WIDTH,
  MATRIX_PREVIEW_HEIGHT,
  MATRIX_PREVIEW_WIDTH,
} from "./hierarchySettingsConfig";
import type {
  HierarchySettingsMode,
  HierarchySettingsModel,
} from "./hierarchySettingsTypes";

type HierarchySettingsPreviewProps = {
  mode: HierarchySettingsMode;
  hierarchy: HierarchySettingsModel;
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
};

export default function HierarchySettingsPreview({
  mode,
  hierarchy,
  circularLinkTension,
  circularBundlingEnabled,
}: HierarchySettingsPreviewProps) {
  if (mode === "circular") {
    return (
      <CircularHierarchyPreview
        layout={hierarchy.circularPreviewLayout}
        previewLinks={hierarchy.circularPreviewLinks}
        activeRoiCount={hierarchy.activeRoiIds.length}
        previewRadius={hierarchy.previewRadius}
        nodeColors={hierarchy.previewNodeColors}
        linkTension={circularLinkTension}
        bundlingEnabled={circularBundlingEnabled}
        displayWidth={CIRCULAR_PREVIEW_WIDTH}
      />
    );
  }

  return (
    <MatrixHierarchyPreview
      matrixPreviewIds={hierarchy.matrixPreviewIds}
      activeRoiCount={hierarchy.activeRoiIds.length}
      nodeColors={hierarchy.previewNodeColors}
      displayWidth={MATRIX_PREVIEW_WIDTH}
      displayHeight={MATRIX_PREVIEW_HEIGHT}
    />
  );
}
