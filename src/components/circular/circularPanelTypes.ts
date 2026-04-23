import type { AtlasDefinition } from "@/types/atlas";
import type {
  NodeLinkInteractionProps,
  NodeLinkPanelCommonProps,
  NodeLinkPresentationProps,
} from "@/types/nodelink";

export type CircularNodeLinkPanelProps = NodeLinkPanelCommonProps & {
  atlasDefinition?: AtlasDefinition | null;
  circularHierarchyFields?: string[];
  circularHierarchyCategoryOrder?: Record<string, string[]>;
};

export type CircularNodeLinkProps = Omit<NodeLinkPanelCommonProps, "compoundId"> &
  NodeLinkPresentationProps &
  NodeLinkInteractionProps & {
    width: number;
    height: number;
    atlasDefinition?: AtlasDefinition | null;
    circularHierarchyFields?: string[];
    circularHierarchyCategoryOrder?: Record<string, string[]>;
  };
