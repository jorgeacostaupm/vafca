import type { ReactNode } from "react";

import AtlasSpatialModeSelect from "@/components/atlas/AtlasSpatialModeSelect";
import NetworkViewFrame from "@/components/layout/NetworkViewFrame";

type SelectedLinksViewFrameProps = {
  summary: string;
  spatialControl?: ReactNode;
  actions: ReactNode;
  children: ReactNode;
};

export default function SelectedLinksViewFrame({
  summary,
  spatialControl,
  actions,
  children,
}: SelectedLinksViewFrameProps) {
  return (
    <NetworkViewFrame
      className="selected-links-view-card"
      title={summary}
      footer={
        <div className="network-view-zoom-controls selected-links-view-card__actions" role="group" aria-label="Selected links view controls">
          {spatialControl ?? <AtlasSpatialModeSelect />}
          {actions}
        </div>
      }
    >
      <div className="selected-links-view">{children}</div>
    </NetworkViewFrame>
  );
}
