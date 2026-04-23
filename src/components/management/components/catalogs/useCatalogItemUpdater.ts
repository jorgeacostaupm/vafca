import { useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import { updateCatalogItem } from "@/store/slices/dataset";
import type { CatalogKey } from "@/components/management/types";

export const useCatalogItemUpdater = () => {
  const dispatch = useAppDispatch();

  return useCallback(
    (catalog: CatalogKey, id: string, changes: Record<string, unknown>) => {
      dispatch(updateCatalogItem({ catalog, id, changes }));
    },
    [dispatch],
  );
};
