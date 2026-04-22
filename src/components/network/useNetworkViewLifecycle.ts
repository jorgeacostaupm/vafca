import { useEffect } from "react";
import {
  pruneInvalidNetworkViews,
  syncNetworkSelectedCompoundId,
} from "@/store/slices/networkVisualization";
import { useAppDispatch } from "@/store/hooks";
import type { MatrixSummary } from "@/types/matrixStore";

type UseNetworkViewLifecycleArgs = {
  matches: MatrixSummary[];
  summariesStatus: "idle" | "loading" | "ready" | "error";
  summaries: MatrixSummary[];
};

export const useNetworkViewLifecycle = ({
  matches,
  summariesStatus,
  summaries,
}: UseNetworkViewLifecycleArgs) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(syncNetworkSelectedCompoundId({ matches }));
  }, [dispatch, matches]);

  useEffect(() => {
    void dispatch(
      pruneInvalidNetworkViews({
        enabled: summariesStatus === "ready",
        validCompoundIds: summaries.map((summary) => summary.compoundId),
      }),
    );
  }, [dispatch, summaries, summariesStatus]);
};
