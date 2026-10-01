import type { ReactNode } from "react";
import type { LayoutItem } from "react-grid-layout";

export type NetworkLayoutProps = {
  panelIds: string[];
  layout: LayoutItem[];
  renderPanel: (id: string) => ReactNode;
  setLayout: (newLayout: LayoutItem[]) => void;
  cols?: number;
  rowHeight?: number;
  margin?: [number, number];
  containerPadding?: [number, number] | null;
  dragHandleClass?: string;
};
