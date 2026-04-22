import { useEffect, useMemo, useState } from "react";
import { getMatrix } from "@/utils/matrixStore";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";

type StoredMatrix = Exclude<Awaited<ReturnType<typeof getMatrix>>, undefined>;

export const useNetworkMatrixCache = (views: NetworkViewDescriptor[]) => {
  const [matrixByCompoundId, setMatrixByCompoundId] = useState<
    Record<string, StoredMatrix | null>
  >({});

  const targetCompoundIds = useMemo(
    () => Array.from(new Set(views.map((view) => view.compoundId))),
    [views],
  );

  useEffect(() => {
    const missing = targetCompoundIds.filter((id) => !(id in matrixByCompoundId));
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        missing.map(async (compoundId) => {
          const matrix = await getMatrix(compoundId);
          return [compoundId, matrix ?? null] as const;
        }),
      );
      if (cancelled) return;
      setMatrixByCompoundId((prev) => {
        const next = { ...prev };
        entries.forEach(([compoundId, matrix]) => {
          next[compoundId] = matrix;
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [matrixByCompoundId, targetCompoundIds]);

  const loadingCompoundIds = useMemo(
    () =>
      new Set(targetCompoundIds.filter((compoundId) => !(compoundId in matrixByCompoundId))),
    [matrixByCompoundId, targetCompoundIds],
  );

  return {
    matrixByCompoundId,
    loadingCompoundIds,
  };
};
