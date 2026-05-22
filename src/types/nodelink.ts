import type { RefObject } from "react";
import type { CircularBundlePathPoint } from "@/types/circular";
import type { MatrixValueRange } from "@/types/matrixView";

export type NodeLinkValueFilters = {
  measure?: [number, number] | null;
  stat?: MatrixValueRange;
};

export type NodeLinkPanelCommonProps = {
  data: number[][];
  labels?: string[];
  compoundId: string;
  matrixLabel: string;
  svgRef?: RefObject<SVGSVGElement>;
  valueFilters?: NodeLinkValueFilters;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  brushEnabled?: boolean;
  geometricZoomEnabled?: boolean;
  hideIsolatedNodes?: boolean;
  circularLinkTension?: number;
  circularBundlingEnabled?: boolean;
  diverging?: boolean;
  onLabelToggle?: (label: string) => void;
  onBrushZoom?: (payload: { labels: string[] }) => void;
};

export type NodeLinkPresentationProps = {
  labelNames: Record<string, string>;
  labelTitles: Record<string, string>;
  labelAcronyms: Record<string, string>;
  nodeColors: Record<string, string>;
};

export type NodeLinkInteractionProps = {
  selectedLinkIds: Set<string>;
  hoveredCell?: { rowId: string; colId: string } | null;
  hoveredNodeId?: string | null;
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
