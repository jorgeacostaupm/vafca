import type { ReactNode } from "react";
import type { AtlasState } from "@/types/atlas";
import type { CategoryOrderEditor, CategoryOrderMap } from "@/components/management/types";
import type { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";

export type HierarchySettingsMode = "circular" | "matrix";

export type HierarchySettingsContentMode = "configuration" | "categoryOrder";

export type HierarchySettingsModel = ReturnType<typeof useManagementHierarchy>;

export type HierarchySettingsConfig = {
  mode: HierarchySettingsMode;
  configurationLabel: string;
  description: string;
  addFieldPlaceholder: string;
  emptyHierarchyMessage: string;
  hierarchyFields: string[];
  selectableFields: string[];
  categoryOrderEditors: CategoryOrderEditor[];
  categoryOrder: CategoryOrderMap;
};

export type HierarchySettingsConfigArgs = {
  mode: HierarchySettingsMode;
  atlas: AtlasState;
  hierarchy: HierarchySettingsModel;
};

export type HierarchySettingsLayoutProps = {
  preview: ReactNode;
  children: ReactNode;
};
