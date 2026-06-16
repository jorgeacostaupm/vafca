import { useCallback, useEffect, useRef, useState } from "react";

import type { SelectedLink } from "@/types/visualizationUi";

export const useSelectedLinkNetworkSelection = (links: SelectedLink[]) => {
  const [selectedNetworkIds, setSelectedNetworkIds] = useState<string[]>([]);
  const dismissedNetworkIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (links.length === 0) return;
    setSelectedNetworkIds((prev) => {
      const seen = new Set(prev);
      const additions: string[] = [];
      links.forEach((link) => {
        link.sources.forEach((source) => {
          if (seen.has(source.compoundId)) return;
          if (dismissedNetworkIdsRef.current.has(source.compoundId)) return;
          seen.add(source.compoundId);
          additions.push(source.compoundId);
        });
      });
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, [links]);

  const setUserSelectedNetworkIds = useCallback((nextSelection: string[]) => {
    setSelectedNetworkIds((prev) => {
      const nextSet = new Set(nextSelection);
      const removed = prev.filter((id) => !nextSet.has(id));
      const added = nextSelection.filter((id) => !prev.includes(id));
      removed.forEach((id) => dismissedNetworkIdsRef.current.add(id));
      added.forEach((id) => dismissedNetworkIdsRef.current.delete(id));
      return nextSelection;
    });
  }, []);

  return {
    selectedNetworkIds,
    setUserSelectedNetworkIds,
  };
};

