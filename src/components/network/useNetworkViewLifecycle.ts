import { useEffect } from "react";

import { useAppDispatch } from "@/store/hooks";
import {
  pruneInvalidNetworkViews,
  syncNetworkSelectedCompoundId,
} from "@/store/slices/networkVisualization";
import type { DatasetNetworkSummary } from "@/types/datasetNetworkView";

type UseNetworkViewLifecycleArgs = {
  matches: DatasetNetworkSummary[];
  summariesStatus: "idle" | "loading" | "ready" | "error";
  summaries: DatasetNetworkSummary[];
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
