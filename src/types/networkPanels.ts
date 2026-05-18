import type { ReactNode, RefObject } from "react";
import type { ComputedView, FilterContributor, ViewVisibility } from "@/types/networkVisualization";
import type { PanelItem } from "@/types/layout";
import type { RootState } from "@/types/store";
import type { ResolvedUiRange } from "@/utils/matrixUiRange";

type MatrixRecord = Exclude<
  Awaited<ReturnType<typeof import("@/utils/matrixStore").getMatrix>>,
  undefined
>;

export type NetworkPanelCommonProps = {
  computed: ComputedView;
  svgRef: RefObject<SVGSVGElement>;
  matrixRecord: MatrixRecord;
  dataset: RootState["dataset"]["data"];
  visibilityByViewId: Record<string, ViewVisibility>;
  nodeFilterContributors: FilterContributor[];
  linkFilterContributors: FilterContributor[];
  runtimeAllowedLinkIds: Set<string> | null;
  runtimeAggregatedAllowedLinkIds: Set<string> | null;
  matrixLegendRange?: ResolvedUiRange;
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

export type NetworkPanelValueFilters = {
  measure: null;
  stat: ComputedView["statFilter"];
};
