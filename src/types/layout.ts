import type { ReactNode } from "react";
import type { LayoutItem } from "react-grid-layout";

export type PanelItem = {
  id: string;
  title: string;
  content: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export type PanelGridLayoutProps = {
  items: PanelItem[];
  layout: LayoutItem[];
  onRemove: (id: string) => void;
  setLayout: (newLayout: LayoutItem[]) => void;
  cols?: number;
  rowHeight?: number;
  margin?: [number, number];
  dragHandleClass?: string;
};
