import { Alert, Empty, Spin } from "antd";
import { useEffect, useState } from "react";

import NetworkSummaryControls from "@/components/network-summary/NetworkSummaryControls";
import NetworkSummaryExecutive from "@/components/network-summary/NetworkSummaryExecutive";
import NetworkSummaryResults from "@/components/network-summary/NetworkSummaryResults";
import NetworkSummarySettingsModal from "@/components/network-summary/NetworkSummarySettingsModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  computeNetworkSummary,
  selectNetworkSummaryControls,
  selectNetworkSummaryError,
  selectNetworkSummaryResult,
  selectNetworkSummarySettings,
  selectNetworkSummaryStatus,
} from "@/store/slices/networkMeasures";

export default function NetworkSummaryTab() {
  const dispatch = useAppDispatch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const controls = useAppSelector(selectNetworkSummaryControls);
  const settings = useAppSelector(selectNetworkSummarySettings);
  const status = useAppSelector(selectNetworkSummaryStatus);
  const error = useAppSelector(selectNetworkSummaryError);
  const summary = useAppSelector(selectNetworkSummaryResult);

  useEffect(() => {
    if (!controls.selectedCompoundId) return;
    void dispatch(computeNetworkSummary());
  }, [
    controls.selectedCompoundId,
    dispatch,
    settings.includeDiagonal,
    settings.includeZeroEdges,
    settings.topItemsLimit,
  ]);

  return (
    <div className="network-summary-tab">
      <div className="network-summary-toolbar">
        <NetworkSummaryControls onOpenSettings={() => setSettingsOpen(true)} />
      </div>
      <NetworkSummarySettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {!controls.selectedCompoundId ? (
        <Empty
          className="network-summary-empty"
          description="Select a network to compute its summary."
        />
      ) : null}

      {status === "loading" ? (
        <div className="network-summary-loading">
          <Spin tip="Computing network summary..." />
        </div>
      ) : null}

      {status === "error" && error ? (
        <Alert type="error" showIcon message={error} />
      ) : null}

      {summary && status !== "loading" ? (
        <div className="network-summary-content">
          <NetworkSummaryExecutive summary={summary} settings={settings} />
          <NetworkSummaryResults summary={summary} settings={settings} />
        </div>
      ) : null}
    </div>
  );
}
