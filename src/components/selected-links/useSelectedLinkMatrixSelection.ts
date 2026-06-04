import { useCallback, useEffect, useRef, useState } from "react";

import type { SelectedLink } from "@/types/visualizationUi";

export const useSelectedLinkMatrixSelection = (links: SelectedLink[]) => {
  const [selectedMatrixIds, setSelectedMatrixIds] = useState<string[]>([]);
  const dismissedMatrixIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (links.length === 0) return;
    setSelectedMatrixIds((prev) => {
      const seen = new Set(prev);
      const additions: string[] = [];
      links.forEach((link) => {
        link.sources.forEach((source) => {
          if (seen.has(source.compoundId)) return;
          if (dismissedMatrixIdsRef.current.has(source.compoundId)) return;
          seen.add(source.compoundId);
          additions.push(source.compoundId);
        });
      });
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, [links]);

  const setUserSelectedMatrixIds = useCallback((nextSelection: string[]) => {
    setSelectedMatrixIds((prev) => {
      const nextSet = new Set(nextSelection);
      const removed = prev.filter((id) => !nextSet.has(id));
      const added = nextSelection.filter((id) => !prev.includes(id));
      removed.forEach((id) => dismissedMatrixIdsRef.current.add(id));
      added.forEach((id) => dismissedMatrixIdsRef.current.delete(id));
      return nextSelection;
    });
  }, []);

  return {
    selectedMatrixIds,
    setUserSelectedMatrixIds,
  };
};

