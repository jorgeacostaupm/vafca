import { useEffect } from "react";
import {
  markNetworkViewError,
  markNetworkViewFormatting,
  markNetworkViewReady,
  patchNetworkControls,
  removeNetworkView,
} from "@/store/slices/networkVisualizationSlice";
import type { AppDispatch } from "@/types/store";
import type { NetworkViewDescriptor } from "@/types/networkVisualization";
import type { MatrixSummary } from "@/types/matrixStore";

type UseNetworkViewLifecycleArgs = {
  dispatch: AppDispatch;
  matches: MatrixSummary[];
  summariesStatus: "idle" | "loading" | "ready" | "error";
  selectedCompoundId: string;
  summaries: MatrixSummary[];
  views: NetworkViewDescriptor[];
  loadingCompoundIds: Set<string>;
  matrixByCompoundId: Record<
    string,
    | Exclude<
        Awaited<ReturnType<typeof import("@/utils/matrixStore").getMatrix>>,
        undefined
      >
    | null
  >;
};

export const useNetworkViewLifecycle = ({
  dispatch,
  matches,
  summariesStatus,
  selectedCompoundId,
  summaries,
  views,
  loadingCompoundIds,
  matrixByCompoundId,
}: UseNetworkViewLifecycleArgs) => {
  useEffect(() => {
    const nextSelected = matches.length === 1 ? matches[0].compoundId : "";
    if (nextSelected === selectedCompoundId) return;
    dispatch(
      patchNetworkControls({
        selectedCompoundId: nextSelected,
      }),
    );
  }, [dispatch, matches, selectedCompoundId]);

  useEffect(() => {
    if (summariesStatus !== "ready") return;
    const validIds = new Set(summaries.map((summary) => summary.compoundId));
    views.forEach((view) => {
      if (validIds.has(view.compoundId)) return;
      dispatch(removeNetworkView({ viewId: view.id }));
    });
  }, [dispatch, summaries, summariesStatus, views]);

  useEffect(() => {
    const pending = views.filter((view) => view.status === "formatting");
    if (pending.length === 0) return;
    const timeout = window.setTimeout(() => {
      pending.forEach((view) => {
        if (loadingCompoundIds.has(view.compoundId)) return;
        const matrix = matrixByCompoundId[view.compoundId];
        if (typeof matrix === "undefined") return;
        if (matrix === null) {
          dispatch(
            markNetworkViewError({
              viewId: view.id,
              error: "Matrix not found in store.",
            }),
          );
          return;
        }
        dispatch(markNetworkViewReady({ viewId: view.id }));
      });
    }, 90);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [dispatch, loadingCompoundIds, matrixByCompoundId, views]);
};

export { markNetworkViewFormatting };
