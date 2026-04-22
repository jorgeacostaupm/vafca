import { createRef, type RefObject } from "react";
import { Button, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { mutateNetworkViewType } from "@/store/slices/networkVisualizationSlice";
import { buildNetworkPanelItem } from "@/components/network/panels/buildNetworkPanelItem";
import {
  ViewTypeSelect,
  LoadingPanelBody,
} from "@/components/network/panels/NetworkPanelCommon";
import type { PanelItem } from "@/types/layout";
import type {
  ComputedView,
  FilterContributor,
  NetworkViewDescriptor,
  ViewVisibility,
} from "@/types/networkVisualization";
import type { NetworkPanelCommonProps } from "@/types/networkPanels";
import type { AppDispatch, RootState } from "@/types/store";

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
  visibilityByViewId: Record<string, ViewVisibility>;
  nodeFilterContributors: FilterContributor[];
  linkFilterContributors: FilterContributor[];
  zoomTargetsByType: (viewId: string) => string[];
  dispatch: AppDispatch;
  markFormatting: NetworkPanelCommonProps["markFormatting"];
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
      visibilityByViewId,
      nodeFilterContributors,
      linkFilterContributors,
      zoomTargetsByType,
      dispatch,
      markFormatting,
    };

    const built = buildNetworkPanelItem(common);

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
