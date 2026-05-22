import { Alert, Card, Space } from "antd";
import { useMemo } from "react";
import PanelGridLayout from "@/components/layout/PanelGridLayout";
import RankingQueryControls from "@/components/rankings/RankingQueryControls";
import RankingResultsTable from "@/components/rankings/RankingResultsTable";
import { formatRankingPanelTitle } from "@/components/rankings/rankingOptions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeRankingResult,
  setRankingLayout,
} from "@/store/slices/rankings";
import type { PanelItem } from "@/types/layout";

export function RankingResultsGrid() {
  const dispatch = useAppDispatch();
  const rankingState = useAppSelector((state) => state.rankings);
  const connectivity = useAppSelector((state) => state.dataset.data?.connectivity);

  const panelItems = useMemo<PanelItem[]>(
    () =>
      rankingState.resultsOrder
        .map((id) => rankingState.resultsById[id])
        .filter(Boolean)
        .map((result) => ({
          id: result.id,
          title: formatRankingPanelTitle(result, connectivity),
          className: "ranking-panel-card",
          content: <RankingResultsTable result={result} />,
        })),
    [connectivity, rankingState.resultsById, rankingState.resultsOrder],
  );

  return (
    <PanelGridLayout
      items={panelItems}
      layout={rankingState.layout}
      onRemove={(resultId) => dispatch(removeRankingResult({ resultId }))}
      setLayout={(nextLayout) =>
        dispatch(
          setRankingLayout(
            nextLayout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })),
          ),
        )
      }
    />
  );
}

export default function RankingsTab() {
  const rankingState = useAppSelector((state) => state.rankings);

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card className="network-control-card" variant="outlined">
        <RankingQueryControls />
        {rankingState.error ? (
          <Alert type="error" showIcon message={rankingState.error} />
        ) : null}
      </Card>
      <RankingResultsGrid />
    </Space>
  );
}
