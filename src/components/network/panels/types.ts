import type { ReactNode, RefObject } from "react";
import type { Dispatch } from "@reduxjs/toolkit";
import type { PanelItem } from "@/components/layout/PanelGridLayout";
import type { ComputedView } from "@/components/network/networkSelectorTypes";
import type { FilterContributor, ViewVisibility } from "@/components/network/networkFormatting";
import type { RootState } from "@/store/store";
import type { StatRangeValue } from "@/types/matrixView";
import type { markNetworkViewFormatting } from "@/store/slices/networkVisualizationSlice";

export type NetworkPanelCommonProps = {
  computed: ComputedView;
  svgRef: RefObject<SVGSVGElement>;
  matrixRecord: Exclude<
    Awaited<ReturnType<typeof import("@/utils/matrixStore").getMatrix>>,
    undefined
  >;
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
  dispatch: Dispatch;
  markFormatting: typeof markNetworkViewFormatting;
};

export type BuildPanelItem = (props: NetworkPanelCommonProps) => PanelItem;

export type ViewTypeSelectProps = {
  value: "matrix" | "circular" | "classic";
  onChange: (value: "matrix" | "circular" | "classic") => void;
};

export type StatusContentBuilder = (args: {
  viewId: string;
  status: "formatting" | "ready" | "error";
  error?: string;
  onRetry: () => void;
}) => ReactNode;

export type ResolveTypeTitle = (type: "matrix" | "circular" | "classic") => string;
