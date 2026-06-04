import type { RefObject } from "react";

import type { CircularBundlePathPoint } from "@/types/circular";
import type { MatrixBrushMode } from "@/types/matrixHeatmap";
import type { MatrixValueRange } from "@/types/matrixView";
import type { ResolvedValueDomain } from "@/types/valueDomain";
import type { MatrixVisualStyle } from "@/types/visualizationUi";

export type NodeLinkValueFilters = {
  measure?: [number, number] | null;
  stat?: MatrixValueRange;
};

export type NodeLinkPanelCommonProps = {
  data: number[][];
  labels?: string[];
  compoundId: string;
  matrixLabel: string;
  svgRef?: RefObject<SVGSVGElement | null>;
  valueFilters?: NodeLinkValueFilters;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  valueDomain?: ResolvedValueDomain;
  brushEnabled?: boolean;
  brushMode?: MatrixBrushMode;
  geometricZoomEnabled?: boolean;
  hideIsolatedNodes?: boolean;
  selectionVisible?: boolean;
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
  circularPositiveLinkColor?: string;
  circularNegativeLinkColor?: string;
  onLabelToggle?: (label: string) => void;
  onBrushZoom?: (payload: { labels: string[] }) => void;
  onBrushSelectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
  onBrushDeselectLinks?: (payload: { links: NodeLinkBrushLink[] }) => void;
};

export type NodeLinkPresentationProps = {
  labelNames: Record<string, string>;
  labelTitles: Record<string, string>;
  labelAcronyms: Record<string, string>;
  nodeColors: Record<string, string>;
};

export type NetworkLinkColorResolver = (value: number) => string;

export type NodeLinkInteractionProps = {
  selectedLinkIds: Set<string>;
  visualStyle: MatrixVisualStyle;
  linkColorResolver: NetworkLinkColorResolver;
  onLinkSelect: (payload: {
    rowId: string;
    colId: string;
    value: number;
    rowLabel: string;
    colLabel: string;
  }) => void;
  onLinkHover?: (payload: { rowId: string; colId: string }) => void;
  onLinkLeave?: () => void;
  onNodeHover?: (id: string) => void;
  onNodeLeave?: () => void;
};

export type NodeLinkBrushLink = {
  rowId: string;
  colId: string;
  value: number;
  rowLabel: string;
  colLabel: string;
};

export type UndirectedLink = {
  source: number;
  target: number;
  value: number;
  rowId: string;
  colId: string;
};

export type ClassicNode = {
  id: number;
  labelId?: string;
  label: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
};

export type ClassicLink = {
  source: number | ClassicNode;
  target: number | ClassicNode;
  value: number;
  rowId: string;
  colId: string;
};

export type CircularNode = {
  id: number;
  labelId?: string;
  label: string;
  angle: number;
  x: number;
  y: number;
};

export type CircularLink = {
  source: number;
  target: number;
  value: number;
  rowId: string;
  colId: string;
  bundlePath?: CircularBundlePathPoint[];
};
