import { Alert } from "antd";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetData } from "@/store/slices/dataset";
import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import HierarchySettingsContent from "./hierarchy/HierarchySettingsContent";
import type { HierarchySettingsMode } from "./hierarchy/hierarchySettingsTypes";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

type HierarchySettingsTabProps = {
  mode: HierarchySettingsMode;
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
};

export default function HierarchySettingsTab({
  mode,
  circularLinkTension,
  circularBundlingEnabled,
}: HierarchySettingsTabProps) {
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const atlas = useAppSelector((state) => state.atlasUi);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));

  const hierarchy = useManagementHierarchy({
    atlas,
    atlasDefinition,
  });

  if (!dataset) {
    return <Alert type="info" message="Load a dataset to configure node ordering." />;
  }

  return (
    <HierarchySettingsContent
      mode={mode}
      atlas={atlas}
      hierarchy={hierarchy}
      circularLinkTension={circularLinkTension}
      circularBundlingEnabled={circularBundlingEnabled}
    />
  );
}
