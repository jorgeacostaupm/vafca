import { Form, Select } from "antd";
import SelectorControls from "@/components/selectors/SelectorControls";
import type { NetworkViewType } from "@/types/networkVisualization";

type Option = { value: string; label: string };

type NetworkSidebarControlsProps = {
  viewType: NetworkViewType;
  onViewTypeChange: (value: NetworkViewType) => void;
  measures: Option[];
  populations: Option[];
  bands: Option[];
  stats: Option[];
  matrices: Option[];
  selection: {
    populationKey: string;
    measureId: string;
    statId: string;
    bandId: string;
    compoundId: string;
  };
  disabled: {
    measures: boolean;
    stats: boolean;
    bands: boolean;
  };
  showMatrixSelect: boolean;
  onChange: {
    populations: (value?: string) => void;
    measure: (value?: string) => void;
    stat: (value?: string) => void;
    band: (value?: string) => void;
    matrix: (value?: string) => void;
  };
  onAdd: () => void;
};

export default function NetworkSidebarControls({
  viewType,
  onViewTypeChange,
  ...selectorProps
}: NetworkSidebarControlsProps) {
  return (
    <>
      <Form layout="vertical" style={{ marginBottom: 8 }}>
        <Form.Item label="View type" style={{ marginBottom: 0 }}>
          <Select
            value={viewType}
            onChange={(value) => onViewTypeChange(value as NetworkViewType)}
            options={[
              { value: "matrix", label: "Matrix" },
              { value: "circular", label: "Circular" },
              { value: "classic", label: "Node-Link" },
            ]}
          />
        </Form.Item>
      </Form>
      <SelectorControls {...selectorProps} />
    </>
  );
}
