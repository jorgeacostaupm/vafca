import { memo, useCallback } from "react";

import NetworkViewFrame from "@/components/layout/NetworkViewFrame";
import { formatRankingPanelTitle } from "@/components/rankings/rankingOptions";
import RankingResultsTable from "@/components/rankings/RankingResultsTable";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";

type RankingResultPanelContainerProps = {
  resultId: string;
  onRemove: (id: string) => void;
};

function RankingResultPanelContainer({
  resultId,
  onRemove,
}: RankingResultPanelContainerProps) {
  const datasetContent = useAppSelector((state) => selectDatasetContent(state));
  const result = useAppSelector((state) => state.rankings.resultsById[resultId]);
  const handleRemove = useCallback(() => {
    onRemove(resultId);
  }, [onRemove, resultId]);

  if (!result) return null;

  return (
    <NetworkViewFrame
      title={formatRankingPanelTitle(result, datasetContent)}
      className="ranking-panel-card"
      onRemove={handleRemove}
    >
      <RankingResultsTable result={result} />
    </NetworkViewFrame>
  );
}

export default memo(RankingResultPanelContainer);
