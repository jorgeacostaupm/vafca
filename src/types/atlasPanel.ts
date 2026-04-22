export type GroupedRow =
  | {
      type: "group";
      key: string;
      level: number;
      title: string;
      groupKey: string;
      count: number;
    }
  | { type: "roi"; key: string; id: string; level: number };
