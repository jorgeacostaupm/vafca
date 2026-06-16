import { useCallback } from "react";

import type { CatalogKey } from "@/components/management/types";
import { useAppDispatch } from "@/store/hooks";
import { updateCatalogItemAndPruneActiveNetworks } from "@/store/slices/dataset";

export const useCatalogItemUpdater = () => {
  const dispatch = useAppDispatch();

  return useCallback(
    (catalog: CatalogKey, id: string, changes: Record<string, unknown>) => {
      dispatch(updateCatalogItemAndPruneActiveNetworks({ catalog, id, changes }));
    },
    [dispatch],
  );
};
