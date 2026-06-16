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
  circularLinkColor?: string;
};

export default function HierarchySettingsPreview({
  mode,
  hierarchy,
  circularLinkTension,
  circularBundlingEnabled,
  circularLinkColor,
}: HierarchySettingsPreviewProps) {
  if (mode === "circular") {
    return (
      <CircularHierarchyPreview
        layout={hierarchy.circularPreviewLayout}
        previewLinks={hierarchy.circularPreviewLinks}
        previewRadius={hierarchy.previewRadius}
        nodeColors={hierarchy.previewNodeColors}
        linkTension={circularLinkTension}
        bundlingEnabled={circularBundlingEnabled}
        linkColor={circularLinkColor}
        displayWidth={CIRCULAR_PREVIEW_WIDTH}
      />
    );
  }

  return (
    <MatrixHierarchyPreview
      matrixPreviewIds={hierarchy.matrixPreviewIds}
      nodeColors={hierarchy.previewNodeColors}
      displayWidth={MATRIX_PREVIEW_WIDTH}
      displayHeight={MATRIX_PREVIEW_HEIGHT}
    />
  );
}
