import { useMemo, useState } from "react";
import { Alert, Button, Radio, Space, Typography, Upload, message } from "antd";
import type { UploadProps } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearUploadedAtlas,
  setUploadedAtlas,
} from "@/store/slices/atlasDefinitionSlice";
import type { AtlasMeshMode } from "@/types/atlas";
import {
  atlasSupports3d,
  countRoisWithoutValidMeshPoints,
  getDefaultGroupByFields,
  humanizeFieldName,
  validateAtlasDefinition,
} from "@/utils/atlas/atlasDefinition";

const { Dragger } = Upload;

export default function AtlasUploader({
  onDefaultsDetected,
}: {
  onDefaultsDetected?: (fields: string[]) => void;
}) {
  const dispatch = useAppDispatch();
  const uploaded = useAppSelector((state) => state.atlasDefinition.uploaded);
  const [meshMode, setMeshMode] = useState<AtlasMeshMode>("with_mesh_points");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const uploadedSummary = useMemo(() => {
    if (!uploaded) return null;
    return `${uploaded.fileName} · ${uploaded.atlas.rois.length} ROIs · ${
      uploaded.meshMode === "with_mesh_points" ? "with mesh points" : "without mesh points"
    }`;
  }, [uploaded]);
  const uploadedSupportsMeshPoints = useMemo(
    () => atlasSupports3d(uploaded?.atlas ?? null, "with_mesh_points"),
    [uploaded?.atlas],
  );
  const uploadedMissingMeshRois = useMemo(
    () => countRoisWithoutValidMeshPoints(uploaded?.atlas ?? null),
    [uploaded?.atlas],
  );

  const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
    setProcessing(true);
    setError(null);

    try {
      const raw = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("The file is not valid JSON.");
      }

      const result = validateAtlasDefinition(parsed, "without_mesh_points");
      if (!result.ok) {
        throw new Error(result.error);
      }
      const supportsMeshPoints = atlasSupports3d(result.atlas, "with_mesh_points");
      const nextMeshMode: AtlasMeshMode = supportsMeshPoints
        ? meshMode
        : "without_mesh_points";

      dispatch(
        setUploadedAtlas({
          atlas: result.atlas,
          fileName: file.name,
          meshMode: nextMeshMode,
        }),
      );

      const defaultFields = getDefaultGroupByFields(result.commonFields);
      onDefaultsDetected?.(defaultFields);

      const humanFields =
        result.commonFields.length > 0
          ? result.commonFields.map(humanizeFieldName).join(", ")
          : "no common scalar fields";

      if (!supportsMeshPoints) {
        const missingMeshCount = countRoisWithoutValidMeshPoints(result.atlas);
        message.warning(
          `Atlas loaded: ${file.name}. ${missingMeshCount} ROIs have no valid mesh points, so it will be used without mesh points.`,
        );
      } else {
        message.success(
          `Atlas loaded: ${file.name}. Common fields: ${humanFields}.`,
        );
      }
    } catch (caught) {
      const nextError =
        caught instanceof Error
          ? caught.message
          : "An unknown error occurred while loading the atlas.";
      setError(nextError);
      message.error(nextError);
    } finally {
      setProcessing(false);
    }

    return Upload.LIST_IGNORE;
  };

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Typography.Text strong>Atlas loader</Typography.Text>

      {!uploaded || uploadedSupportsMeshPoints ? (
        <Radio.Group
          value={meshMode}
          onChange={(event) => setMeshMode(event.target.value as AtlasMeshMode)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { label: "Atlas with mesh points", value: "with_mesh_points" },
            { label: "Atlas without mesh points", value: "without_mesh_points" },
          ]}
        />
      ) : (
        <Alert
          type="warning"
          showIcon
          message={`This atlas has ${uploadedMissingMeshRois} ROIs without valid mesh points. Mesh points cannot be enabled.`}
        />
      )}

      <Dragger
        accept=".json,application/json"
        showUploadList={false}
        multiple={false}
        beforeUpload={beforeUpload}
        disabled={processing}
      >
        <p className="ant-upload-text">Drag and drop a JSON atlas file here</p>
        <p className="ant-upload-hint">
          The parser validates structure, ROI ids and checks whether all ROIs include valid mesh points.
        </p>
      </Dragger>

      {uploadedSummary ? (
        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <Typography.Text type="secondary">{uploadedSummary}</Typography.Text>
          <Button
            size="small"
            onClick={() => {
              dispatch(clearUploadedAtlas());
              setError(null);
              message.success("Uploaded atlas cleared. Using default atlas source.");
            }}
          >
            Clear uploaded atlas
          </Button>
        </Space>
      ) : null}

      {error ? <Alert type="error" showIcon message={error} /> : null}
    </Space>
  );
}
