import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  VerticalAlignMiddleOutlined,
} from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { useMemo, useRef } from "react";
import { shallowEqual } from "react-redux";

import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import {
  selectAtlasDisplayLabelsById,
  selectAtlasEnabledById,
} from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

import { useAtlasScene } from "./atlasPanelHooks";

type AtlasPanelViewerProps = {
  enableMeshPoints: boolean;
};

export function AtlasPanelViewer({ enableMeshPoints }: AtlasPanelViewerProps) {
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const enabledById = useAppSelector(selectAtlasEnabledById, shallowEqual);
  const displayLabelsById = useAppSelector(
    selectAtlasDisplayLabelsById,
    shallowEqual,
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));

  const enable3d = useMemo(
    () => enableMeshPoints && Boolean(atlasDefinition?.nodes?.length),
    [atlasDefinition, enableMeshPoints],
  );

  const { applyCameraPose } = useAtlasScene({
    atlasDefinition,
    enabledById,
    displayLabelsById,
    containerRef,
    enable3d,
  });

  return (
    <div className="atlas-panel__viewer">
      <div className="atlas-panel__viewer-header">
        <Space size={8}>
          <Button
            size="small"
            icon={<VerticalAlignMiddleOutlined />}
            onClick={() => applyCameraPose(0, 1, 0)}
          >
            Front
          </Button>
          <Button
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={() => applyCameraPose(1, 0, 0)}
          >
            Right
          </Button>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            onClick={() => applyCameraPose(0, 0, 1)}
          >
            Top
          </Button>
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => applyCameraPose(-1, 0, 0)}
          >
            Left
          </Button>
        </Space>
        <Typography.Text type="secondary">
          Double-click an Node to hide it
        </Typography.Text>
      </div>

      <div
        className="atlas-panel__viewer-canvas"
        ref={containerRef}
      />
    </div>
  );
}
