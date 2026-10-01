import { UpOutlined, ZoomInOutlined } from "@ant-design/icons";
import { Button, Popover } from "antd";
import { useMemo } from "react";

import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  applyNetworkZoom,
} from "@/store/slices/networkVisualization";
import { selectCurrentAnnotation, selectSelectedLinks } from "@/store/slices/visualizationUi";
import type { ComputedView } from "@/types/networkVisualization";
import {
  buildNetworkZoomSelection,
  type NetworkZoomSelectionMode,
} from "@/utils/networkZoomSelection";

type NetworkZoomModesPopoverProps = {
  view: ComputedView["view"];
  computed: ComputedView;
};

type ZoomButtonConfig = {
  label: string;
  getSelection: () => ReturnType<typeof buildNetworkZoomSelection>;
  disabled?: boolean;
};

const NETWORK_ZOOM_SELECTION_MODES: NetworkZoomSelectionMode[] = [
  "nodes",
  "links",
  "union",
];

export default function NetworkZoomModesPopover({
  view,
  computed,
}: NetworkZoomModesPopoverProps) {
  const dispatch = useAppDispatch();
  const annotation = useAppSelector(selectCurrentAnnotation);
  const selectedLinks = useAppSelector(selectSelectedLinks);
  const zoomTargetsByType = useNetworkZoomTargets();

  const zoomSelections = useMemo(
    () =>
      NETWORK_ZOOM_SELECTION_MODES.reduce(
        (selections, mode) => ({
          ...selections,
          [mode]: buildNetworkZoomSelection({
            mode,
            selectedNodeIds: annotation.nodes.map(node => node.id),
            selectedLinks,
            availableLabels: computed.availableLabels,
          }),
        }),
        {} as Record<
          NetworkZoomSelectionMode,
          ReturnType<typeof buildNetworkZoomSelection>
        >,
      ),
    [
      computed.availableLabels,
      annotation.nodes,
      selectedLinks,
    ],
  );

  const canZoom = Object.values(zoomSelections).some(Boolean);

  const applyZoomSelection = (
    selection: ReturnType<typeof buildNetworkZoomSelection>,
  ) => {
    if (!selection) return;
    dispatch(
      applyNetworkZoom({
        targetViewIds: zoomTargetsByType(view.id),
        selection,
      }),
    );
  };

  const content = (
    <div className="network-zoom-modes">
      <div className="network-zoom-modes__grid">
        {[
          {
            label: "Selected nodes",
            getSelection: () => zoomSelections.nodes,
            disabled: !zoomSelections.nodes,
          },
          {
            label: "Annotation links",
            getSelection: () => zoomSelections.links,
            disabled: !zoomSelections.links,
          },
          {
            label: "Nodes + links",
            getSelection: () => zoomSelections.union,
            disabled: !zoomSelections.union,
          },
        ].map((item: ZoomButtonConfig) => (
          <Button
            key={item.label}
            size="small"
            icon={<ZoomInOutlined />}
            disabled={item.disabled}
            onClick={() => applyZoomSelection(item.getSelection())}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger={["click"]}
      placement="topLeft"
      destroyTooltipOnHide
    >
      <Button
        size="small"
        type="text"
        aria-label="Zoom modes"
        title="Zoom modes"
        icon={<ZoomInOutlined />}
        disabled={!canZoom}
      >
        <UpOutlined />
      </Button>
    </Popover>
  );
}
