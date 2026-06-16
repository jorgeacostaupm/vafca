import type { UploadProps } from "antd";
import { Alert, Button, Space, Typography, Upload } from "antd";
import { useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearUploadedAtlasAndSync,
  selectUploadedAtlasError,
  selectUploadedAtlasStatus,
  uploadAtlasDefinitionAndSync,
} from "@/store/slices/atlasDefinition";

const { Dragger } = Upload;

type AtlasUploaderProps = {
  onDefaultsDetected?: (fields: string[]) => void;
};

export default function AtlasUploader({
  onDefaultsDetected,
}: AtlasUploaderProps) {
  const dispatch = useAppDispatch();
  const uploaded = useAppSelector((state) => state.atlasDefinition.uploaded);
  const uploadStatus = useAppSelector(selectUploadedAtlasStatus);
  const uploadError = useAppSelector(selectUploadedAtlasError);

  const uploadedSummary = useMemo(() => {
    if (!uploaded) return null;
    return `${uploaded.fileName} · ${uploaded.atlas.nodes.length} Nodes`;
  }, [uploaded]);

  const beforeUpload: UploadProps["beforeUpload"] = async (file) => {
    try {
      const result = await dispatch(
        uploadAtlasDefinitionAndSync({ file }),
      ).unwrap();
      onDefaultsDetected?.(result.defaultGroupFields);
    } catch {
      // The global notification listener reports upload errors.
    }

    return Upload.LIST_IGNORE;
  };

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Dragger
        className="atlas-uploader__dropzone"
        accept=".json,application/json"
        showUploadList={false}
        multiple={false}
        beforeUpload={beforeUpload}
        disabled={uploadStatus === "loading"}
      >
        <p className="ant-upload-text">Drag and drop a JSON atlas file here</p>
        <p className="ant-upload-hint">
          The parser validates structure and Node ids. Node mesh_points are used
          by the atlas viewer when they are present and valid.
        </p>
      </Dragger>

      {uploadedSummary ? (
        <Space style={{ justifyContent: "space-between", width: "100%" }}>
          <Typography.Text type="secondary">{uploadedSummary}</Typography.Text>
          <Button
            size="small"
            onClick={() => {
              void dispatch(clearUploadedAtlasAndSync());
            }}
          >
            Clear uploaded atlas
          </Button>
        </Space>
      ) : null}

      {uploadError ? (
        <Alert type="error" showIcon message={uploadError} />
      ) : null}
    </Space>
  );
}
