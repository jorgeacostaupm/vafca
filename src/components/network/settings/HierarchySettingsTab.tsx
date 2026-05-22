import { Alert } from "antd";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";
import HierarchySettingsContent from "./hierarchy/HierarchySettingsContent";
import type { HierarchySettingsMode } from "./hierarchy/hierarchySettingsTypes";

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
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );

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
