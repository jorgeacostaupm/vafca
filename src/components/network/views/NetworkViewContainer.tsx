import NetworkViewFrame from "@/components/layout/NetworkViewFrame";
import NetworkViewTypeSelector from "@/components/network/views/NetworkViewTypeSelector";
import { resolveNetworkViewTitle } from "@/components/network/views/networkViewTitle";
import NetworkViewActions from "@/components/network/views/NetworkViewActions";
import NetworkViewRenderer from "@/components/network/views/NetworkViewRenderer";
import {
  LoadingPanelBody,
  NetworkViewReloadButton,
} from "@/components/network/views/NetworkViewStatus";
import { useNetworkViewModel } from "@/components/network/views/useNetworkViewModel";

type NetworkViewContainerProps = {
  viewId: string;
  onRemove: (id: string) => void;
};

export default function NetworkViewContainer({
  viewId,
  onRemove,
}: NetworkViewContainerProps) {
  const model = useNetworkViewModel(viewId);

  if (model.kind === "missing") return null;

  if (model.kind === "loading") {
    return (
      <NetworkViewFrame
        title={model.view.label}
        onRemove={() => onRemove(model.view.id)}
        actions={<NetworkViewReloadButton viewId={model.view.id} />}
      >
        <LoadingPanelBody text="Loading matrix…" />
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
          isMatrixView={model.isMatrixView}
          viewTitle={viewTitle}
          svgRef={model.svgRef}
        />
      }
      onRemove={() => onRemove(model.view.id)}
    >
      <NetworkViewRenderer
        view={model.view}
        computed={model.computed}
        adapted={model.adapted}
        isMatrixView={model.isMatrixView}
        matrixLegendRange={model.matrixLegendRange}
        svgRef={model.svgRef}
        valueFilters={model.valueFilters}
      />
    </NetworkViewFrame>
  );
}
