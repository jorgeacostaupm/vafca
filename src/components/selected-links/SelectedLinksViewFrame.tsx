import type { ReactNode } from "react";

import AtlasSpatialModeSelect from "@/components/atlas/AtlasSpatialModeSelect";
import NetworkViewFrame from "@/components/layout/NetworkViewFrame";

type SelectedLinksViewFrameProps = {
  actions: ReactNode;
  children: ReactNode;
};

export default function SelectedLinksViewFrame({
  actions,
  children,
}: SelectedLinksViewFrameProps) {
  return (
    <NetworkViewFrame
      className="selected-links-view-card"
      title="Selected Nodes & Links"
      footer={
        <div className="network-view-zoom-controls selected-links-view-card__actions" role="group" aria-label="Selected links view controls">
          <AtlasSpatialModeSelect />
          {actions}
        </div>
      }
    >
      <div className="selected-links-view">{children}</div>
    </NetworkViewFrame>
  );
}
