import type { AtlasDefinition } from "@/types/atlas";
import type { Catalogs } from "@/types/connectivityBundle";

export type CatalogKey = keyof Catalogs;

export type MoveDirection = "up" | "down";

export type CategoryOrderMap = Record<string, string[]>;

export type CategoryOrderEditor = {
  key: string;
  field: string;
  parentValues: string[];
  values: string[];
};

export type BuildCategoryOrderEditorsArgs = {
  atlasDefinition: AtlasDefinition | null;
  hierarchyFields: string[];
  categoryOrder: CategoryOrderMap;
  sourceIds: string[];
};
