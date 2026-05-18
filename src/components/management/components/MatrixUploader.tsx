import { Alert, Space, Spin, Typography, Upload } from "antd";
import type { UploadProps } from "antd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { uploadMatricesIntoDataset } from "@/store/slices/dataset";
import { loadMatrixSummaries } from "@/store/slices/matrixSummaries";

const { Dragger } = Upload;

const MAX_VISIBLE_ERRORS = 5;

function MatrixUploader() {
  const dispatch = useAppDispatch();
  const { matrixUploadStatus, matrixUploadError, lastMatrixUpload } =
    useAppSelector((state) => state.dataset);

  const beforeUpload: UploadProps["beforeUpload"] = async (file, fileList) => {
    if (file.uid !== fileList[0]?.uid) {
      return Upload.LIST_IGNORE;
    }

    try {
      await dispatch(uploadMatricesIntoDataset({ files: [file] })).unwrap();
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
      <Dragger
        className="matrix-uploader__dropzone"
        accept=".json,application/json"
        showUploadList={false}
        multiple={false}
        beforeUpload={beforeUpload}
        disabled={isValidating}
      >
        <p className="ant-upload-text">Drag and drop one fc-connectivity-v1.0 JSON bundle here</p>
        <p className="ant-upload-hint">
          The bundle is loaded atomically and validated against the current
          fc-connectivity-v1.0 format.
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
              ? "Data loaded with validation errors"
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
                  .slice(0, MAX_VISIBLE_ERRORS)
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
                  ?.slice(0, MAX_VISIBLE_ERRORS)
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
