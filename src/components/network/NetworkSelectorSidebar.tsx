import { Col } from "antd";
import NetworkSidebarControls from "@/components/network/NetworkSidebarControls";
import { patchNetworkControls } from "@/store/slices/networkVisualization";
import type { AppDispatch } from "@/types/store";
import type { NetworkSelectorControlsState } from "@/types/networkVisualization";

type Option = { value: string; label: string };

type NetworkSelectorSidebarProps = {
  dispatch: AppDispatch;
  controls: NetworkSelectorControlsState;
  measures: Option[];
  populations: Option[];
  bands: Option[];
  stats: Option[];
  matrices: Option[];
  showMatrixSelect: boolean;
  onAdd: () => void;
};

export default function NetworkSelectorSidebar({
  dispatch,
  controls,
  measures,
  populations,
  bands,
  stats,
  matrices,
  showMatrixSelect,
  onAdd,
}: NetworkSelectorSidebarProps) {
  return (
    <Col xs={24} lg={4}>
      <div className="matrix-sidebar">
        <NetworkSidebarControls
          viewType={controls.viewType}
          onViewTypeChange={(value) =>
            dispatch(
              patchNetworkControls({
                viewType: value,
              }),
            )
          }
          measures={measures}
          populations={populations}
          bands={bands}
          stats={stats}
          matrices={matrices}
          selection={{
            populationKey: controls.populationKey,
            measureId: controls.measureId,
            statId: controls.statId,
            bandId: controls.bandId,
            compoundId: controls.selectedCompoundId,
          }}
          disabled={{
            measures: !controls.populationKey,
            stats: !controls.measureId,
            bands: !controls.statId,
          }}
          showMatrixSelect={showMatrixSelect}
          onChange={{
            populations: (value) =>
              dispatch(
                patchNetworkControls({
                  populationKey: value ?? "",
                  measureId: "",
                  statId: "",
                  bandId: "",
                }),
              ),
            measure: (value) =>
              dispatch(
                patchNetworkControls({
                  measureId: value ?? "",
                  statId: "",
                  bandId: "",
                }),
              ),
            stat: (value) =>
              dispatch(
                patchNetworkControls({
                  statId: value ?? "",
                  bandId: "",
                }),
              ),
            band: (value) =>
              dispatch(
                patchNetworkControls({
                  bandId: value ?? "",
                }),
              ),
            matrix: (value) =>
              dispatch(
                patchNetworkControls({
                  selectedCompoundId: value ?? "",
                }),
              ),
          }}
          onAdd={onAdd}
        />
      </div>
    </Col>
  );
}
