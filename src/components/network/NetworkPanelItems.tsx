import { createRef, type RefObject } from "react";
import { Space } from "antd";
import { buildNetworkPanelItem } from "@/components/network/panels/buildNetworkPanelItem";
import {
  LoadingPanelBody,
  NetworkPanelReloadButton,
  NetworkViewTypeControl,
} from "@/components/network/panels/NetworkPanelCommon";
import type { PanelItem } from "@/types/layout";
import type {
  ComputedView,
  FilterContributor,
  NetworkViewDescriptor,
  ViewVisibility,
} from "@/types/networkVisualization";
import type { RootState } from "@/types/store";

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
  visibilityByViewId: Record<string, ViewVisibility>;
  nodeFilterContributors: FilterContributor[];
  linkFilterContributors: FilterContributor[];
};

export const buildNetworkPanelItems = ({
  views,
  matrixByCompoundId,
  loadingCompoundIds,
  computedByViewId,
  dataset,
  visibilityByViewId,
  nodeFilterContributors,
  linkFilterContributors,
}: BuildNetworkPanelItemsArgs): PanelItem[] =>
  views.map((view) => {
    const svgRef = createRef<SVGSVGElement>() as RefObject<SVGSVGElement>;
    const matrixRecord = matrixByCompoundId[view.compoundId];
    const isLoadingMatrix =
      loadingCompoundIds.has(view.compoundId) ||
      typeof matrixRecord === "undefined";
    const computed = computedByViewId[view.id];
    const typeSelect = <NetworkViewTypeControl viewId={view.id} value={view.type} />;

    if (isLoadingMatrix || !computed || !matrixRecord) {
      return {
        id: view.id,
        title: `${resolveViewTypeTitle(view.type)} · ${view.label}`,
        actions: (
          <Space size={4}>
            {typeSelect}
            <NetworkPanelReloadButton viewId={view.id} />
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
      visibilityByViewId,
      nodeFilterContributors,
      linkFilterContributors,
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
