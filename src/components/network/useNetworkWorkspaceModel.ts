import { useNetworkWorkspaceLayout } from "@/components/network/useNetworkWorkspaceLayout";

export const useNetworkWorkspaceModel = () => {
  const layout = useNetworkWorkspaceLayout();

  return {
    panelIds: layout.panelIds,
    combinedLayout: layout.combinedLayout,
    removePanel: layout.removePanel,
    updateLayout: layout.updateLayout,
    isNetworkView: layout.isNetworkView,
  };
};
