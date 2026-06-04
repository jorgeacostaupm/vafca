import { useCallback } from "react";

import NetworkLayout from "@/components/layout/NetworkLayout";
import { useNetworkWorkspaceModel } from "@/components/network/useNetworkWorkspaceModel";
import { NetworkViewComputationProvider } from "@/components/network/views/NetworkViewComputationProvider";
import NetworkViewContainer from "@/components/network/views/NetworkViewContainer";
import RankingResultPanelContainer from "@/components/rankings/RankingResultPanelContainer";

export default function NetworkVisualizationWorkspace() {
  const {
    panelIds,
    combinedLayout,
    removePanel,
    updateLayout,
    isNetworkView,
  } = useNetworkWorkspaceModel();
  const renderWorkspaceView = useCallback(
    (id: string) =>
      isNetworkView(id) ? (
        <NetworkViewContainer viewId={id} onRemove={removePanel} />
      ) : (
        <RankingResultPanelContainer resultId={id} onRemove={removePanel} />
      ),
    [isNetworkView, removePanel],
  );

  return (
    <NetworkViewComputationProvider>
      <NetworkLayout
        panelIds={panelIds}
        layout={combinedLayout}
        renderPanel={renderWorkspaceView}
        setLayout={updateLayout}
      />
    </NetworkViewComputationProvider>
  );
}
