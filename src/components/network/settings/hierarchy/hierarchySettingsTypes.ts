import type { useManagementHierarchy } from "@/components/management/hooks/useManagementHierarchy";

export type HierarchySettingsMode = "circular" | "matrix";

export type HierarchySettingsModel = ReturnType<typeof useManagementHierarchy>;
