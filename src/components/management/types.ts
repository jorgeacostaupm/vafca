import type { AtlasDefinition } from "@/types/atlas";
import type { ConnectivityCatalogs } from "@/types/catalogs";

export type CatalogKey = keyof ConnectivityCatalogs;

export type UpdateCatalogItemHandler = (
  catalog: CatalogKey,
  id: string,
  changes: Record<string, unknown>,
) => void;

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
