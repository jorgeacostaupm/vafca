export type NetworkNode = {
  id: string;
  label?: string;
  group?: string | number;
};

export type NetworkLink = {
  source: string;
  target: string;
  weight?: number;
  [key: string]: unknown;
};

export type NetworkMatrix = number[][];

export type NetworkData = {
  nodes: NetworkNode[];
  links: NetworkLink[];
  matrix?: NetworkMatrix;
  meta?: Record<string, unknown>;
};
