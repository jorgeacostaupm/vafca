import { Card } from "antd";
import type { ReactNode } from "react";

type AtlasPanelLayoutProps = {
  has3d: boolean;
  toolbar: ReactNode;
  controls: ReactNode;
  filters: ReactNode;
  list: ReactNode;
  viewer: ReactNode;
};

export function AtlasPanelLayout({
  has3d,
  toolbar,
  controls,
  filters,
  list,
  viewer,
}: AtlasPanelLayoutProps) {
  const listRegion = (
    <div className="atlas-panel__list">
      {list}
    </div>
  );

  const controlCard = (
    <Card className="network-control-card atlas-panel__control-card" variant="outlined">
      <div className="atlas-panel__control-stack">
        <div className="atlas-panel__control-heading">
          <div className="atlas-panel__control-main">{controls}</div>
          {toolbar}
        </div>
        {filters}
      </div>
    </Card>
  );

  if (has3d) {
    return (
      <div className="atlas-panel atlas-panel--with-viewer">
        <div className="atlas-panel__control-region">
          {controlCard}
        </div>

        <div className="atlas-panel__viewer-region">
          {viewer}
        </div>

        <div className="atlas-panel__list-region">
          {listRegion}
        </div>
      </div>
    );
  }

  return (
    <div className="atlas-panel">
      <div className="atlas-panel__control-region">
        {controlCard}
      </div>

      <div className="atlas-panel__list-region">
        {listRegion}
      </div>
    </div>
  );
}
