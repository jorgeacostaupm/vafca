import type { RefObject } from "react";

export type NodeLinkValueFilters = {
  measure?: [number, number] | null;
  stat?: [number, number] | Array<[number, number]> | null;
};

export type NodeLinkPanelCommonProps = {
  data: number[][];
  labels?: string[];
  labelNames?: Record<string, string>;
  labelTitles?: Record<string, string>;
  labelAcronyms?: Record<string, string>;
  nodeColors?: Record<string, string>;
  compoundId: string;
  matrixLabel: string;
  svgRef?: RefObject<SVGSVGElement>;
  valueFilters?: NodeLinkValueFilters;
  selectedZoomLabels?: string[];
  linkWidthRange?: [number, number];
  brushEnabled?: boolean;
  geometricZoomEnabled?: boolean;
  hideIsolatedNodes?: boolean;
  diverging?: boolean;
  onLabelToggle?: (label: string) => void;
  onBrushZoom?: (payload: { labels: string[] }) => void;
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
