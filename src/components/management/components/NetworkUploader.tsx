import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { Alert, Space, Spin, Typography, Upload } from "antd";

import {
  DEFAULT_NETWORK_IMPORT_MODE,
  MAX_VISIBLE_IMPORT_ISSUES,
} from "@/config/ui";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loadDatasetFromUploadedZip,
  selectDatasetOperationsState,
} from "@/store/slices/dataset";

const { Dragger } = Upload;

function NetworkUploader() {
  const dispatch = useAppDispatch();
  const { networkImportStatus, networkImportError, lastNetworkImport } =
    useAppSelector(selectDatasetOperationsState);

  const beforeUpload: UploadProps["beforeUpload"] = async (file, fileList) => {
    if (file.uid !== fileList[0]?.uid) {
      return Upload.LIST_IGNORE;
    }

    try {
      await dispatch(
        loadDatasetFromUploadedZip({
          files: [file],
          mode: DEFAULT_NETWORK_IMPORT_MODE,
        }),
      ).unwrap();
    } catch {
      // The notification listener and local alert expose upload failures.
    }

    return Upload.LIST_IGNORE;
  };

  const hasValidationErrors =
    lastNetworkImport !== null && lastNetworkImport.errors.length > 0;
  const hasWarnings =
    lastNetworkImport !== null && (lastNetworkImport.warnings?.length ?? 0) > 0;
  const isValidating = networkImportStatus === "loading";

  return (
    <div className="network-uploader">
      <Dragger
        className="network-uploader__dropzone"
        accept=".zip,application/zip,application/x-zip-compressed"
        showUploadList={false}
        multiple={false}
        beforeUpload={beforeUpload}
        disabled={isValidating}
      >
        <p className="network-uploader__icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Drag and drop one VAFCA ZIP dataset here</p>
        <p className="ant-upload-hint">
          Or click to choose a file. Imports use lenient validation by default.
        </p>
      </Dragger>

      {isValidating ? (
        <Alert
          type="info"
          showIcon
          icon={<Spin size="small" />}
          message="Validating data"
          description="Checking network dimensions and empty values."
        />
      ) : null}

      {!isValidating && lastNetworkImport ? (
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
                  {lastNetworkImport.validNetworks} valid{" "}
                  {lastNetworkImport.validNetworks === 1 ? "network" : "networks"} and{" "}
                  {lastNetworkImport.invalidNetworks} error
                  {lastNetworkImport.invalidNetworks === 1 ? "" : "s"} found.
                </Typography.Text>
                {lastNetworkImport.errors
                  .slice(0, MAX_VISIBLE_IMPORT_ISSUES)
                  .map((error, index) => (
                    <Typography.Text key={`${error.source}-${index}`} type="secondary">
                      {error.source}
                      {error.networkId ? ` · ${error.networkId}` : ""}:{" "}
                      {error.message}
                    </Typography.Text>
                  ))}
              </Space>
            ) : hasWarnings ? (
              <Space direction="vertical" size={4}>
                <Typography.Text>File loaded with warnings.</Typography.Text>
                {lastNetworkImport.warnings
                  ?.slice(0, MAX_VISIBLE_IMPORT_ISSUES)
                  .map((warning, index) => (
                    <Typography.Text key={`${warning.source}-${index}`} type="secondary">
                      {warning.source}: {warning.message}
                    </Typography.Text>
                  ))}
              </Space>
            ) : (
              `${lastNetworkImport.validNetworks} ${
                lastNetworkImport.validNetworks === 1 ? "network" : "networks"
              } validated and loaded without errors.`
            )
          }
        />
      ) : null}

      {!isValidating && networkImportError ? (
        <Alert
          type="error"
          showIcon
          message="Data could not be loaded"
          description={networkImportError}
        />
      ) : null}
    </div>
  );
}

export default NetworkUploader;
