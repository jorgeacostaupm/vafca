import { memo, useCallback } from "react";

import NetworkViewFrame from "@/components/layout/NetworkViewFrame";
import NetworkViewActions from "@/components/network/views/NetworkViewActions";
import NetworkViewRenderer from "@/components/network/views/NetworkViewRenderer";
import {
  LoadingPanelBody,
  NetworkViewReloadButton,
} from "@/components/network/views/NetworkViewStatus";
import { resolveNetworkViewTitle } from "@/components/network/views/networkViewTitle";
import NetworkViewTypeSelector from "@/components/network/views/NetworkViewTypeSelector";
import { useNetworkViewModel } from "@/components/network/views/useNetworkViewModel";

type NetworkViewContainerProps = {
  viewId: string;
  onRemove: (id: string) => void;
};

function NetworkViewContainer({
  viewId,
  onRemove,
}: NetworkViewContainerProps) {
  const model = useNetworkViewModel(viewId);
  const handleRemove = useCallback(() => {
    onRemove(viewId);
  }, [onRemove, viewId]);

  if (model.kind === "missing") return null;

  if (model.kind === "loading") {
    return (
      <NetworkViewFrame
        title={model.view.label}
        onRemove={handleRemove}
        actions={<NetworkViewReloadButton viewId={model.view.id} />}
      >
        <LoadingPanelBody text="Loading network…" />
      </NetworkViewFrame>
    );
  }

  const viewTitle = resolveNetworkViewTitle(model.view.type);

  return (
    <NetworkViewFrame
      title={model.view.label}
      className={model.className}
      headerStart={<NetworkViewTypeSelector view={model.view} />}
      actions={
        <NetworkViewActions
          view={model.view}
          computed={model.computed}
          renderData={model.renderData}
          isMatrixView={model.isMatrixView}
          viewTitle={viewTitle}
          svgRef={model.svgRef}
        />
      }
      onRemove={handleRemove}
    >
      <NetworkViewRenderer
        view={model.view}
        computed={model.computed}
        renderData={model.renderData}
        isMatrixView={model.isMatrixView}
        svgRef={model.svgRef}
        valueFilters={model.valueFilters}
      />
    </NetworkViewFrame>
  );
}

export default memo(NetworkViewContainer);
