import { useCallback, useState } from "react";
import type { LayoutItem } from "react-grid-layout";

type UsePanelLayoutOptions = {
  defaultW?: number;
  defaultH?: number;
  columns?: number;
  yOffset?: number;
};

type AddPanelOptions = {
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  yOffset?: number;
};

type UsePanelLayoutReturn = {
  layout: LayoutItem[];
  setLayout: (nextLayout: LayoutItem[]) => void;
  addPanel: (id: string, options?: AddPanelOptions) => void;
  removePanel: (id: string) => void;
  reset: () => void;
};

const DEFAULT_W = 9;
const DEFAULT_H = 4;
const DEFAULT_COLUMNS = 3;

export default function usePanelLayout(
  options: UsePanelLayoutOptions = {},
): UsePanelLayoutReturn {
  const {
    defaultW = DEFAULT_W,
    defaultH = DEFAULT_H,
    columns = DEFAULT_COLUMNS,
    yOffset = defaultH,
  } = options;
  const [layout, setLayout] = useState<LayoutItem[]>([]);

  const addPanel = useCallback(
    (id: string, panelOptions: AddPanelOptions = {}) => {
      setLayout((prev) => {
        const w = panelOptions.w ?? defaultW;
        const h = panelOptions.h ?? defaultH;
        const x = panelOptions.x ?? (prev.length % columns) * defaultW;
        const y = panelOptions.y ?? 0;
        const offset = panelOptions.yOffset ?? yOffset;

        return [
          { i: id, x, y, w, h },
          ...prev.map((entry) => ({ ...entry, y: entry.y + offset })),
        ];
      });
    },
    [columns, defaultH, defaultW, yOffset],
  );

  const removePanel = useCallback((id: string) => {
    setLayout((prev) => prev.filter((entry) => entry.i !== id));
  }, []);

  const reset = useCallback(() => {
    setLayout([]);
  }, []);

  return { layout, setLayout, addPanel, removePanel, reset };
}
