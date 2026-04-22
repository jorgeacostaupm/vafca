import { useEffect, useState } from "react";
import { getAllMatrixSummaries } from "@/utils/matrixStore";
import type { MatrixSummary } from "@/types/matrixStore";

type MatrixSummaryStatus = "idle" | "loading" | "ready" | "error";

export const useMatrixSummaries = (reloadKey?: string | number) => {
  const [summaries, setSummaries] = useState<MatrixSummary[]>([]);
  const [status, setStatus] = useState<MatrixSummaryStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    setError(null);
    getAllMatrixSummaries()
      .then((items) => {
        if (!active) return;
        setSummaries(items);
        setStatus("ready");
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load matrices.");
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { summaries, status, error };
};
