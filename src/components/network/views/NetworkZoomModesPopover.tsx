import { DownOutlined, ZoomInOutlined } from "@ant-design/icons";
import { Button, InputNumber, Popover, Slider } from "antd";
import { useMemo, useState } from "react";

import { useNetworkZoomTargets } from "@/components/network/useNetworkZoomTargets";
import type { buildNetworkViewRenderData } from "@/components/network/views/networkViewData";
import {
  MAX_NETWORK_PERCENT_ZOOM_PERCENT,
  MIN_NETWORK_PERCENT_ZOOM_PERCENT,
} from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  applyNetworkZoom,
  patchNetworkMatrixSettings,
  patchNetworkNodeLinkSettings,
  selectNetworkControls,
} from "@/store/slices/networkVisualization";
import { selectSelectedLinks } from "@/store/slices/visualizationUi";
import type { ComputedView } from "@/types/networkVisualization";
import {
  buildPercentZoomSelection,
  hasPercentZoomLinks,
  type PercentZoomMode,
} from "@/utils/networkPercentZoom";
import {
  buildNetworkZoomSelection,
  type NetworkZoomSelectionMode,
} from "@/utils/networkZoomSelection";

type NetworkZoomModesPopoverProps = {
  view: ComputedView["view"];
  computed: ComputedView;
  renderData: ReturnType<typeof buildNetworkViewRenderData>;
};

type ZoomButtonConfig = {
  label: string;
  getSelection: () =>
    | ReturnType<typeof buildNetworkZoomSelection>
    | ReturnType<typeof buildPercentZoomSelection>;
  disabled?: boolean;
};

const NETWORK_ZOOM_SELECTION_MODES: NetworkZoomSelectionMode[] = [
  "nodes",
  "links",
  "union",
];

const getRenderDataMatrix = (
  renderData: ReturnType<typeof buildNetworkViewRenderData>,
) =>
  renderData.type === "matrix"
    ? {
        data: renderData.payload.data,
        rowLabels: renderData.payload.rowLabels,
        colLabels: renderData.payload.colLabels,
      }
    : {
        data: renderData.payload.data,
        rowLabels: renderData.payload.labels,
        colLabels: renderData.payload.labels,
      };

export default function NetworkZoomModesPopover({
  view,
  computed,
  renderData,
}: NetworkZoomModesPopoverProps) {
  const dispatch = useAppDispatch();
  const selectedLinks = useAppSelector(selectSelectedLinks);
  const networkControls = useAppSelector(selectNetworkControls);
  const zoomTargetsByType = useNetworkZoomTargets();
  const renderDataMatrix = useMemo(() => getRenderDataMatrix(renderData), [renderData]);
  const [draftPercent, setDraftPercent] = useState(computed.zoomLinkPercent);

  const zoomSelections = useMemo(
    () =>
      NETWORK_ZOOM_SELECTION_MODES.reduce(
        (selections, mode) => ({
          ...selections,
          [mode]: buildNetworkZoomSelection({
            mode,
            selectedNodeIds: computed.orderedZoomLabels,
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
      computed.orderedZoomLabels,
      selectedLinks,
    ],
  );

  const hasPercentLinks = useMemo(
    () =>
      hasPercentZoomLinks({
        ...renderDataMatrix,
        symmetric: computed.symmetric,
        includeAutoconnections:
          networkControls.percentZoomIncludeAutoconnections,
      }),
    [
      renderDataMatrix,
      computed.symmetric,
      networkControls.percentZoomIncludeAutoconnections,
    ],
  );

  const hasDivergingRange =
    computed.hasNegativeRange || computed.valueDomain.scaleType === "diverging";
  const canZoom =
    Object.values(zoomSelections).some(Boolean) || hasPercentLinks;

  const patchZoomPercent = (value: number) => {
    if (value === computed.zoomLinkPercent) return;
    const patch = { zoomLinkPercent: value };
    if (view.type === "matrix") {
      dispatch(patchNetworkMatrixSettings({ viewId: view.id, patch }));
      return;
    }
    dispatch(patchNetworkNodeLinkSettings({ viewId: view.id, patch }));
  };

  const normalizePercent = (value: number | null) =>
    Math.min(
      Math.max(value ?? computed.zoomLinkPercent, MIN_NETWORK_PERCENT_ZOOM_PERCENT),
      MAX_NETWORK_PERCENT_ZOOM_PERCENT,
    );

  const commitZoomPercent = (value: number | null) => {
    patchZoomPercent(
      normalizePercent(value),
    );
  };

  const handleZoomPercentChange = (value: number | null) => {
    setDraftPercent(normalizePercent(value));
  };

  const buildPercentSelection = (mode: PercentZoomMode) =>
    buildPercentZoomSelection({
      ...renderDataMatrix,
      symmetric: computed.symmetric,
      mode,
      percent: draftPercent,
      includeAutoconnections:
        networkControls.percentZoomIncludeAutoconnections,
    });

  const applyZoomSelection = (
    selection:
      | ReturnType<typeof buildNetworkZoomSelection>
      | ReturnType<typeof buildPercentZoomSelection>,
  ) => {
    if (!selection) return;
    commitZoomPercent(draftPercent);
    dispatch(
      applyNetworkZoom({
        targetViewIds: zoomTargetsByType(view.id),
        selection,
      }),
    );
  };

  const content = (
    <div className="network-zoom-modes">
      <div className="network-zoom-modes__percent">
        <span className="network-zoom-modes__label">Link percent</span>
        <InputNumber
          min={MIN_NETWORK_PERCENT_ZOOM_PERCENT}
          max={MAX_NETWORK_PERCENT_ZOOM_PERCENT}
          value={draftPercent}
          addonAfter="%"
          onChange={handleZoomPercentChange}
          onBlur={() => commitZoomPercent(draftPercent)}
          onPressEnter={() => commitZoomPercent(draftPercent)}
        />
      </div>
      <Slider
        min={MIN_NETWORK_PERCENT_ZOOM_PERCENT}
        max={MAX_NETWORK_PERCENT_ZOOM_PERCENT}
        value={draftPercent}
        onChange={handleZoomPercentChange}
        onChangeComplete={(value) =>
          commitZoomPercent(Array.isArray(value) ? value[0] : value)
        }
      />
      <div className="network-zoom-modes__grid">
        {[
          {
            label: "Selected nodes",
            getSelection: () => zoomSelections.nodes,
            disabled: !zoomSelections.nodes,
          },
          {
            label: "Selected links",
            getSelection: () => zoomSelections.links,
            disabled: !zoomSelections.links,
          },
          {
            label: "Nodes + links",
            getSelection: () => zoomSelections.union,
            disabled: !zoomSelections.union,
          },
          {
            label: "Top links",
            getSelection: () => buildPercentSelection("top"),
            disabled: !hasPercentLinks,
          },
          {
            label: "Bottom links",
            getSelection: () => buildPercentSelection("bottom"),
            disabled: !hasPercentLinks,
          },
          {
            label: "Absolute top",
            getSelection: () => buildPercentSelection("absoluteTop"),
            disabled: !hasDivergingRange || !hasPercentLinks,
          },
          {
            label: "Absolute bottom",
            getSelection: () => buildPercentSelection("absoluteBottom"),
            disabled: !hasDivergingRange || !hasPercentLinks,
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
      placement="bottomRight"
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
        <DownOutlined />
      </Button>
    </Popover>
  );
}
