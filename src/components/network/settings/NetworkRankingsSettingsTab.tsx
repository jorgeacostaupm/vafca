import { Space } from "antd";

import SettingsSection from "@/components/common/SettingsSection";
import LinkRankingModeSetting from "@/components/network/settings/LinkRankingModeSetting";
import RankingAutoconnectionsSettings from "@/components/network/settings/RankingAutoconnectionsSettings";
import RankingTopNSetting from "@/components/network/settings/RankingTopNSetting";

export default function NetworkRankingsSettingsTab() {
  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <SettingsSection
        title="Rankings"
        description="Use this menu to configure how selected network links and nodes are ranked."
      >
        <RankingTopNSetting />
        <LinkRankingModeSetting />
        <RankingAutoconnectionsSettings />
      </SettingsSection>
    </Space>
  );
}
