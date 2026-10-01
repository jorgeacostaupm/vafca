import { useCallback, useMemo } from "react";
import type { LayoutItem } from "react-grid-layout";

import NetworkLayout from "@/components/layout/NetworkLayout";
import { useNetworkWorkspaceLayout } from "@/components/network/useNetworkWorkspaceLayout";
import { NetworkViewComputationProvider } from "@/components/network/views/NetworkViewComputationProvider";
import NetworkViewContainer from "@/components/network/views/NetworkViewContainer";
import RankingResultPanelContainer from "@/components/rankings/RankingResultPanelContainer";
import { NETWORK_VIEW_SQUARE_CONSTRAINT } from "@/config/ui";

export default function NetworkVisualizationWorkspace() {
  const {
    panelIds,
    combinedLayout,
    removePanel,
    updateLayout,
    isNetworkView,
  } = useNetworkWorkspaceLayout();
  const layout = useMemo<LayoutItem[]>(
    () =>
      combinedLayout.map((item) =>
        isNetworkView(item.i)
          ? { ...item, constraints: [NETWORK_VIEW_SQUARE_CONSTRAINT] }
          : item,
      ),
    [combinedLayout, isNetworkView],
  );
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
        layout={layout}
        renderPanel={renderWorkspaceView}
        setLayout={updateLayout}
      />
    </NetworkViewComputationProvider>
  );
}
