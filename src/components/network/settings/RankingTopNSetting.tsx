import { NumberOutlined } from "@ant-design/icons";
import { Form, Segmented } from "antd";

import { createNetworkSegmentedOption } from "@/components/network/segmentedOption";
import { topNOptions } from "@/components/rankings/rankingOptions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { patchRankingQuery } from "@/store/slices/rankings";
import type { RankingTopN } from "@/types/rankings";

const rankingTopNOptions = topNOptions.map((option) =>
  createNetworkSegmentedOption<RankingTopN>(
    option.value as RankingTopN,
    <NumberOutlined />,
    option.label,
  ),
);

export default function RankingTopNSetting() {
  const dispatch = useAppDispatch();
  const topN = useAppSelector((state) => state.rankings.currentQuery.topN);

  return (
    <Form layout="vertical" style={{ marginBottom: 0 }}>
      <Form.Item
        label="Ranking Top N"
        className="network-segmented-setting network-ranking-top-n-setting"
        style={{ marginBottom: 0 }}
      >
        <Segmented
          value={topN}
          onChange={(value) =>
            dispatch(
              patchRankingQuery({
                topN: value as RankingTopN,
              }),
            )
          }
          options={rankingTopNOptions}
        />
      </Form.Item>
    </Form>
  );
}
