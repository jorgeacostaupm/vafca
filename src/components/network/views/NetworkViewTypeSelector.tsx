import { Select } from "antd";
import { networkViewTypeIconOptions } from "@/components/network/networkViewTypeOptions";
import { useAppDispatch } from "@/store/hooks";
import { mutateNetworkViewType } from "@/store/slices/networkVisualization";
import type {
  NetworkViewDescriptor,
  NetworkViewType,
} from "@/types/networkVisualization";

type NetworkViewTypeSelectorProps = {
  view: NetworkViewDescriptor;
};

export default function NetworkViewTypeSelector({
  view,
}: NetworkViewTypeSelectorProps) {
  const dispatch = useAppDispatch();

  return (
    <Select<NetworkViewType>
      aria-label="View type"
      size="small"
      value={view.type}
      options={networkViewTypeIconOptions}
      popupMatchSelectWidth={false}
      onChange={(nextType) =>
        dispatch(
          mutateNetworkViewType({
            viewId: view.id,
            nextType,
          }),
        )
      }
    />
  );
}
