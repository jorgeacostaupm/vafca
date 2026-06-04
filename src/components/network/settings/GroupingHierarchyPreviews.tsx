import { Alert } from "antd";

import CircularHierarchyPreview from "@/components/management/components/CircularHierarchyPreview";
import MatrixHierarchyPreview from "@/components/management/components/MatrixHierarchyPreview";
import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import type { D3GroupingPaletteKey } from "@/config/groupingPalettes";
import {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
  GROUPING_CIRCULAR_HIERARCHY_PREVIEW_WIDTH,
  GROUPING_HIERARCHY_PREVIEW_HEIGHT,
  GROUPING_MATRIX_HIERARCHY_PREVIEW_WIDTH,
} from "@/config/ui";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { selectNetworkControls } from "@/store/slices/networkVisualization";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

type GroupingHierarchyPreviewsProps = {
  previewColorFields: string[];
  previewColorPalette: D3GroupingPaletteKey;
};

export default function GroupingHierarchyPreviews({
  previewColorFields,
  previewColorPalette,
}: GroupingHierarchyPreviewsProps) {
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const controls = useAppSelector(selectNetworkControls);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));
  const hierarchy = useManagementHierarchy({
    atlas,
    atlasDefinition,
    previewColorFields,
    previewColorPalette,
    syncCategoryOrder: false,
  });
  const circularLinkTension =
    controls.circularLinkTension ?? DEFAULT_CIRCULAR_LINK_TENSION;
  const circularBundlingEnabled =
    controls.circularBundlingEnabled ?? DEFAULT_CIRCULAR_BUNDLING_ENABLED;

  if (!dataset) {
    return <Alert type="info" message="Load a dataset to preview grouping order." />;
  }

  return (
    <div className="network-settings-grouping__previews">
      <MatrixHierarchyPreview
        matrixPreviewIds={hierarchy.matrixPreviewIds}
        activeRoiCount={hierarchy.activeRoiIds.length}
        nodeColors={hierarchy.previewNodeColors}
        displayWidth={GROUPING_MATRIX_HIERARCHY_PREVIEW_WIDTH}
        displayHeight={GROUPING_HIERARCHY_PREVIEW_HEIGHT}
        orientation="vertical"
      />
      <CircularHierarchyPreview
        layout={hierarchy.circularPreviewLayout}
        previewLinks={hierarchy.circularPreviewLinks}
        activeRoiCount={hierarchy.activeRoiIds.length}
        previewRadius={hierarchy.previewRadius}
        nodeColors={hierarchy.previewNodeColors}
        linkTension={circularLinkTension}
        bundlingEnabled={circularBundlingEnabled}
        displayWidth={GROUPING_CIRCULAR_HIERARCHY_PREVIEW_WIDTH}
      />
    </div>
  );
}
