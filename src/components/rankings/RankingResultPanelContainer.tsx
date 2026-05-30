import RankingResultsTable from "@/components/rankings/RankingResultsTable";
import { formatRankingPanelTitle } from "@/components/rankings/rankingOptions";
import NetworkViewFrame from "@/components/layout/NetworkViewFrame";
import { useAppSelector } from "@/store/hooks";
import { selectDatasetContent } from "@/store/slices/dataset";

type RankingResultPanelContainerProps = {
  resultId: string;
  onRemove: (id: string) => void;
};

export default function RankingResultPanelContainer({
  resultId,
  onRemove,
}: RankingResultPanelContainerProps) {
  const datasetContent = useAppSelector((state) => selectDatasetContent(state));
  const result = useAppSelector((state) => state.rankings.resultsById[resultId]);

  if (!result) return null;

  return (
    <NetworkViewFrame
      title={formatRankingPanelTitle(result, datasetContent)}
      className="ranking-panel-card"
      onRemove={() => onRemove(result.id)}
    >
      <RankingResultsTable result={result} />
    </NetworkViewFrame>
  );
}
