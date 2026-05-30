import { Alert, Radio, Space, Spin, Typography, Upload } from "antd";
import type { UploadProps } from "antd";
import { useState } from "react";
import {
  DEFAULT_CONNECTIVITY_IMPORT_MODE,
  MAX_VISIBLE_IMPORT_ISSUES,
} from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectDatasetOperationsState,
  loadDatasetFromUploadedZip,
} from "@/store/slices/dataset";
import { loadMatrixSummaries } from "@/store/slices/matrixSummaries";
import type { ConnectivityImportMode } from "@/utils/import/types";

const { Dragger } = Upload;

function MatrixUploader() {
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<ConnectivityImportMode>(
    DEFAULT_CONNECTIVITY_IMPORT_MODE,
  );
  const { matrixUploadStatus, matrixUploadError, lastMatrixUpload } =
    useAppSelector(selectDatasetOperationsState);

  const beforeUpload: UploadProps["beforeUpload"] = async (file, fileList) => {
    if (file.uid !== fileList[0]?.uid) {
      return Upload.LIST_IGNORE;
    }

    try {
      await dispatch(loadDatasetFromUploadedZip({ files: [file], mode })).unwrap();
      await dispatch(loadMatrixSummaries());
    } catch {
      // The notification listener and local alert expose upload failures.
    }

    return Upload.LIST_IGNORE;
  };

  const hasValidationErrors =
    lastMatrixUpload !== null && lastMatrixUpload.errors.length > 0;
  const hasWarnings =
    lastMatrixUpload !== null && (lastMatrixUpload.warnings?.length ?? 0) > 0;
  const isValidating = matrixUploadStatus === "loading";

  return (
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={mode}
        disabled={isValidating}
        onChange={(event) => setMode(event.target.value as ConnectivityImportMode)}
        options={[
          { label: "Lenient", value: "lenient" },
          { label: "Strict", value: "strict" },
        ]}
      />

      <Dragger
        className="matrix-uploader__dropzone"
        accept=".zip,application/zip,application/x-zip-compressed"
        showUploadList={false}
        multiple={false}
        beforeUpload={beforeUpload}
        disabled={isValidating}
      >
        <p className="ant-upload-text">Drag and drop one VAFCA ZIP dataset here</p>
        <p className="ant-upload-hint">
          The ZIP is loaded atomically and normalized before it reaches the workspace.
        </p>
      </Dragger>

      {isValidating ? (
        <Alert
          type="info"
          showIcon
          icon={<Spin size="small" />}
          message="Validating data"
          description="Checking matrix dimensions and empty values."
        />
      ) : null}

      {!isValidating && lastMatrixUpload ? (
        <Alert
          type={hasValidationErrors ? "warning" : "success"}
          showIcon
          message={
            hasValidationErrors
              ? "Data could not be loaded"
              : "Data loaded successfully"
          }
          description={
            hasValidationErrors ? (
              <Space direction="vertical" size={4}>
                <Typography.Text>
                  {lastMatrixUpload.validMatrices} valid{" "}
                  {lastMatrixUpload.validMatrices === 1 ? "matrix" : "matrices"} and{" "}
                  {lastMatrixUpload.invalidMatrices} error
                  {lastMatrixUpload.invalidMatrices === 1 ? "" : "s"} found.
                </Typography.Text>
                {lastMatrixUpload.errors
                  .slice(0, MAX_VISIBLE_IMPORT_ISSUES)
                  .map((error, index) => (
                    <Typography.Text key={`${error.source}-${index}`} type="secondary">
                      {error.source}
                      {error.matrixId ? ` · ${error.matrixId}` : ""}:{" "}
                      {error.message}
                    </Typography.Text>
                  ))}
              </Space>
            ) : hasWarnings ? (
              <Space direction="vertical" size={4}>
                <Typography.Text>File loaded with warnings.</Typography.Text>
                {lastMatrixUpload.warnings
                  ?.slice(0, MAX_VISIBLE_IMPORT_ISSUES)
                  .map((warning, index) => (
                    <Typography.Text key={`${warning.source}-${index}`} type="secondary">
                      {warning.source}: {warning.message}
                    </Typography.Text>
                  ))}
              </Space>
            ) : (
              `${lastMatrixUpload.validMatrices} ${
                lastMatrixUpload.validMatrices === 1 ? "matrix" : "matrices"
              } validated and loaded without errors.`
            )
          }
        />
      ) : null}

      {!isValidating && matrixUploadError ? (
        <Alert
          type="error"
          showIcon
          message="Data could not be loaded"
          description={matrixUploadError}
        />
      ) : null}
    </Space>
  );
}

export default MatrixUploader;
