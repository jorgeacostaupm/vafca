import NetworkLayout from "@/components/layout/NetworkLayout";
import NetworkViewContainer from "@/components/network/views/NetworkViewContainer";
import RankingResultPanelContainer from "@/components/rankings/RankingResultPanelContainer";
import { useNetworkWorkspaceModel } from "@/components/network/useNetworkWorkspaceModel";

export default function NetworkVisualizationWorkspace() {
  const {
    panelIds,
    combinedLayout,
    removePanel,
    updateLayout,
    isNetworkView,
  } = useNetworkWorkspaceModel();

  return (
    <NetworkLayout
      panelIds={panelIds}
      layout={combinedLayout}
      renderPanel={(id) =>
        isNetworkView(id) ? (
          <NetworkViewContainer viewId={id} onRemove={removePanel} />
        ) : (
          <RankingResultPanelContainer resultId={id} onRemove={removePanel} />
        )
      }
      setLayout={updateLayout}
    />
  );
}
