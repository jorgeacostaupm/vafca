import { useState } from "react";
import { Alert, Checkbox, Space, Typography, Upload } from "antd";
import type { UploadProps } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uploadMatricesIntoDataset } from "@/store/slices/dataset";
import { loadMatrixSummaries } from "@/store/slices/matrixSummaries";

const { Dragger } = Upload;

const MAX_VISIBLE_ERRORS = 5;

function MatrixUploader() {
  const dispatch = useAppDispatch();
  const [resetAtlas, setResetAtlas] = useState(false);
  const { matrixUploadStatus, matrixUploadError, lastMatrixUpload } =
    useAppSelector((state) => state.dataset);

  const beforeUpload: UploadProps["beforeUpload"] = async (file, fileList) => {
    if (file.uid !== fileList[0]?.uid) {
      return Upload.LIST_IGNORE;
    }

    try {
      await dispatch(uploadMatricesIntoDataset({ files: fileList, resetAtlas })).unwrap();
      await dispatch(loadMatrixSummaries());
    } catch {
      // The notification listener and local alert expose upload failures.
    }

    return Upload.LIST_IGNORE;
  };

  const hasValidationErrors =
    lastMatrixUpload !== null && lastMatrixUpload.errors.length > 0;

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Checkbox
        checked={resetAtlas}
        onChange={(event) => setResetAtlas(event.target.checked)}
      >
        Reset loaded atlas and infer a minimal atlas from uploaded matrices
      </Checkbox>

      <Dragger
        className="matrix-uploader__dropzone"
        accept=".json,application/json"
        showUploadList={false}
        multiple
        beforeUpload={beforeUpload}
        disabled={matrixUploadStatus === "loading"}
      >
        <p className="ant-upload-text">Drag and drop matrix JSON files here</p>
        <p className="ant-upload-hint">
          Valid matrices are loaded into the current dataset. Invalid entries
          are skipped and reported.
        </p>
      </Dragger>

      {lastMatrixUpload ? (
        <Alert
          type={hasValidationErrors ? "warning" : "success"}
          showIcon
          message={`${lastMatrixUpload.validMatrices} valid matrix${
            lastMatrixUpload.validMatrices === 1 ? "" : "es"
          } loaded`}
          description={
            hasValidationErrors ? (
              <Space direction="vertical" size={4}>
                <Typography.Text>
                  {lastMatrixUpload.invalidMatrices} validation error
                  {lastMatrixUpload.invalidMatrices === 1 ? "" : "s"} found.
                </Typography.Text>
                {lastMatrixUpload.errors
                  .slice(0, MAX_VISIBLE_ERRORS)
                  .map((error, index) => (
                    <Typography.Text key={`${error.source}-${index}`} type="secondary">
                      {error.source}
                      {error.matrixId ? ` · ${error.matrixId}` : ""}:{" "}
                      {error.message}
                    </Typography.Text>
                  ))}
              </Space>
            ) : (
              `${lastMatrixUpload.files} file${
                lastMatrixUpload.files === 1 ? "" : "s"
              } processed without validation errors.`
            )
          }
        />
      ) : null}

      {matrixUploadError ? (
        <Alert type="error" showIcon message={matrixUploadError} />
      ) : null}
    </Space>
  );
}

export default MatrixUploader;
