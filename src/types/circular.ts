export {
  DEFAULT_CIRCULAR_BUNDLING_ENABLED,
  DEFAULT_CIRCULAR_LINK_TENSION,
} from "@/config/ui";

export type CircularHierarchyLayoutPoint = {
  labelId: string;
  order: number;
  angle: number;
  x: number;
  y: number;
};

export type CircularBundlePathPoint = {
  angle: number;
  radius: number;
};

export type CircularPreviewLink = {
  id: string;
  sourceLabelId: string;
  targetLabelId: string;
  path?: CircularBundlePathPoint[];
};
