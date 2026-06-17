import { Form, Switch } from "antd";

import {
  DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS,
  DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS,
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
  const allowNodeRankingAutoconnections = useAppSelector(
    (state) =>
      state.rankings.currentQuery.allowNodeRankingAutoconnections ??
      DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS,
  );

  return (
    <Form layout="vertical" className="network-settings-rankings__switches">
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
      <Form.Item label="Allow autoconnections in node rankings">
        <Switch
          checked={allowNodeRankingAutoconnections}
          onChange={(value) =>
            dispatch(
              patchRankingQuery({
                allowNodeRankingAutoconnections: value,
              }),
            )
          }
        />
      </Form.Item>
    </Form>
  );
}
