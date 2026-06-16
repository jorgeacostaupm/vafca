import { useEffect } from "react";

import { useAppDispatch } from "@/store/hooks";
import {
  pruneInvalidNetworkViews,
  syncNetworkSelectedCompoundId,
} from "@/store/slices/networkVisualization";
import type { NetworkSummaryItem } from "@/types/networkViewStore";

type UseNetworkViewLifecycleArgs = {
  matches: NetworkSummaryItem[];
  summariesStatus: "idle" | "loading" | "ready" | "error";
  summaries: NetworkSummaryItem[];
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
