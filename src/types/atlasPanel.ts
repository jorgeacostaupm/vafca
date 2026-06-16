export type GroupedRow =
  | {
      type: "group";
      key: string;
      level: number;
      title: string;
      groupKey: string;
      count: number;
    }
  | { type: "node"; key: string; id: string; level: number };

export type AtlasColorCategoryItem = {
  key: string;
  label: string;
  count: number;
  color: string;
};
