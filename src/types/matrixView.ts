export type StatRangeValue =
  | [number, number]
  | {
      negative: [number, number];
      positive: [number, number];
      negativeEnabled?: boolean;
      positiveEnabled?: boolean;
    };

export type MatrixValueRange =
  | [number, number]
  | Array<[number, number]>
  | null
  | undefined;
