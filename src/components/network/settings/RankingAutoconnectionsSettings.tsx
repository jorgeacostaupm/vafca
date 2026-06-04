import { Form, Space, Switch } from "antd";

import {
  DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS,
  DEFAULT_ROI_RANKING_ALLOW_AUTOCONNECTIONS,
} from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { patchRankingQuery } from "@/store/slices/rankings";

export default function RankingAutoconnectionsSettings() {
  const dispatch = useAppDispatch();
  const allowLinkRankingAutoconnections = useAppSelector(
    (state) =>
      state.rankings.currentQuery.allowLinkRankingAutoconnections ??
      DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS,
  );
  const allowRoiRankingAutoconnections = useAppSelector(
    (state) =>
      state.rankings.currentQuery.allowRoiRankingAutoconnections ??
      DEFAULT_ROI_RANKING_ALLOW_AUTOCONNECTIONS,
  );

  return (
    <Form layout="vertical" style={{ marginBottom: 0 }}>
      <Space direction="vertical" size={12}>
        <Form.Item label="Allow autoconnections in link rankings">
          <Switch
            checked={allowLinkRankingAutoconnections}
            onChange={(value) =>
              dispatch(
                patchRankingQuery({
                  allowLinkRankingAutoconnections: value,
                }),
              )
            }
          />
        </Form.Item>
        <Form.Item label="Allow autoconnections in ROI rankings" style={{ marginBottom: 0 }}>
          <Switch
            checked={allowRoiRankingAutoconnections}
            onChange={(value) =>
              dispatch(
                patchRankingQuery({
                  allowRoiRankingAutoconnections: value,
                }),
              )
            }
          />
        </Form.Item>
      </Space>
    </Form>
  );
}
