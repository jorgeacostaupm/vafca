import { AppstoreOutlined, TableOutlined } from "@ant-design/icons";
import { Form, Segmented } from "antd";
import { createNetworkSegmentedOption } from "@/components/network/segmentedOption";
import { DEFAULT_LINK_COLLECTION_RANKING_MODE } from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { patchRankingQuery } from "@/store/slices/rankings";
import type { LinkCollectionRankingMode } from "@/types/rankings";

const linkRankingModeOptions = [
  createNetworkSegmentedOption<LinkCollectionRankingMode>(
    "aggregated",
    <AppstoreOutlined />,
    "Aggregated",
  ),
  createNetworkSegmentedOption<LinkCollectionRankingMode>(
    "expanded",
    <TableOutlined />,
    "Row per layer",
  ),
];

export default function LinkRankingModeSetting() {
  const dispatch = useAppDispatch();
  const mode = useAppSelector(
    (state) =>
      state.rankings.currentQuery.linkCollectionMode ??
      DEFAULT_LINK_COLLECTION_RANKING_MODE,
  );

  return (
    <Form layout="vertical" style={{ marginBottom: 0 }}>
      <Form.Item
        label="Link ranking rows"
        className="network-segmented-setting network-link-ranking-mode-setting"
        style={{ marginBottom: 0 }}
      >
        <Segmented
          value={mode}
          onChange={(value) =>
            dispatch(
              patchRankingQuery({
                linkCollectionMode: value as LinkCollectionRankingMode,
              }),
            )
          }
          options={linkRankingModeOptions}
        />
      </Form.Item>
    </Form>
  );
}
