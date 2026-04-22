import { createRef, type RefObject } from "react";
import { Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { mutateNetworkViewType } from "@/store/slices/networkVisualizationSlice";
import { buildMatrixPanelItem } from "@/components/network/panels/buildMatrixPanelItem";
import { buildNodeLinkPanelItem } from "@/components/network/panels/buildNodeLinkPanelItem";
import {
  ViewTypeSelect,
  LoadingPanelBody,
} from "@/components/network/panels/NetworkPanelCommon";
import type { PanelItem } from "@/components/layout/PanelGridLayout";
import type { ComputedView } from "@/components/network/networkSelectorTypes";
import type { FilterContributor, ViewVisibility } from "@/components/network/networkFormatting";
import type { AppDispatch, RootState } from "@/store/store";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";
import type { StatRangeValue } from "@/types/matrixView";
import type { markNetworkViewFormatting } from "@/store/slices/networkVisualizationSlice";

const resolveViewTypeTitle = (type: "matrix" | "circular" | "classic") =>
  type === "matrix" ? "Matrix" : type === "circular" ? "Circular" : "Node-Link";

type BuildNetworkPanelItemsArgs = {
  views: NetworkViewDescriptor[];
  matrixByCompoundId: Record<
    string,
    | Exclude<
        Awaited<ReturnType<typeof import("@/utils/matrixStore").getMatrix>>,
        undefined
      >
    | null
  >;
  loadingCompoundIds: Set<string>;
  computedByViewId: Record<string, ComputedView>;
  dataset: RootState["dataset"]["data"];
  matrixShape: RootState["visualizationUi"]["matrixShape"];
  labelNames: Record<string, string>;
  labelTitles: Record<string, string>;
  labelAcronyms: Record<string, string>;
  nodeColors: Record<string, string>;
  defaultStatRanges: Record<string, StatRangeValue>;
  visibilityByViewId: Record<string, ViewVisibility>;
  nodeFilterContributors: FilterContributor[];
  linkFilterContributors: FilterContributor[];
  zoomTargetsByType: (viewId: string) => string[];
  dispatch: AppDispatch;
  markFormatting: typeof markNetworkViewFormatting;
};

export const buildNetworkPanelItems = ({
  views,
  matrixByCompoundId,
  loadingCompoundIds,
  computedByViewId,
  dataset,
  matrixShape,
  labelNames,
  labelTitles,
  labelAcronyms,
  nodeColors,
  defaultStatRanges,
  visibilityByViewId,
  nodeFilterContributors,
  linkFilterContributors,
  zoomTargetsByType,
  dispatch,
  markFormatting,
}: BuildNetworkPanelItemsArgs): PanelItem[] =>
  views.map((view) => {
    const svgRef = createRef<SVGSVGElement>() as RefObject<SVGSVGElement>;
    const matrixRecord = matrixByCompoundId[view.compoundId];
    const isLoadingMatrix =
      loadingCompoundIds.has(view.compoundId) ||
      typeof matrixRecord === "undefined";
    const computed = computedByViewId[view.id];
    const typeSelect = (
      <ViewTypeSelect
        value={view.type}
        onChange={(value) =>
          dispatch(
            mutateNetworkViewType({
              viewId: view.id,
              nextType: value,
            }),
          )
        }
      />
    );

    if (isLoadingMatrix || !computed || !matrixRecord) {
      return {
        id: view.id,
        title: `${resolveViewTypeTitle(view.type)} · ${view.label}`,
        actions: (
          <Space size={4}>
            {typeSelect}
            <Button
              size="small"
              type="text"
              aria-label="Reload view"
              icon={<ReloadOutlined />}
              onClick={() => dispatch(markFormatting({ viewId: view.id }))}
            />
          </Space>
        ),
        content: <LoadingPanelBody text="Loading matrix…" />,
      };
    }

    const common = {
      computed,
      svgRef,
      matrixRecord,
      dataset,
      matrixShape,
      labelNames,
      labelTitles,
      labelAcronyms,
      nodeColors,
      defaultStatRanges,
      visibilityByViewId,
      nodeFilterContributors,
      linkFilterContributors,
      zoomTargetsByType,
      dispatch,
      markFormatting,
    };

    const built =
      view.type === "matrix"
        ? buildMatrixPanelItem(common)
        : buildNodeLinkPanelItem(common);

    return {
      ...built,
      actions: (
        <Space size={4}>
          {typeSelect}
          {built.actions}
        </Space>
      ),
    };
  });
