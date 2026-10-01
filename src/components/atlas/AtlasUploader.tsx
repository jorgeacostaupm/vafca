import { ClearOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { Alert, Button, Space, Typography, Upload } from 'antd'
import { useMemo } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  clearUploadedAtlasAndSync,
  selectUploadedAtlasError,
  selectUploadedAtlasStatus,
  uploadAtlasDefinitionAndSync,
} from '@/store/slices/atlasDefinition'

const { Dragger } = Upload

export default function AtlasUploader() {
  const dispatch = useAppDispatch()
  const uploaded = useAppSelector((state) => state.atlasDefinition.uploaded)
  const uploadStatus = useAppSelector(selectUploadedAtlasStatus)
  const uploadError = useAppSelector(selectUploadedAtlasError)

  const uploadedSummary = useMemo(() => {
    if (!uploaded) return null
    return `${uploaded.fileName} · ${uploaded.atlas.nodes.length} Nodes`
  }, [uploaded])

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    try {
      await dispatch(uploadAtlasDefinitionAndSync({ file })).unwrap()
    } catch {
      // The global notification listener reports upload errors.
    }

    return Upload.LIST_IGNORE
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Dragger
        className="atlas-uploader__dropzone"
        accept=".json,.zip,application/json,application/zip"
        showUploadList={false}
        multiple={false}
        beforeUpload={beforeUpload}
        disabled={uploadStatus === 'loading'}
      >
        <p className="ant-upload-text">Drag & Drop a JSON atlas or atlas ZIP here</p>
        <p className="ant-upload-hint">
          Use JSON for node definitions, or a ZIP containing atlas.json. Load 3D atlas geometry with the dataset ZIP through spatial/manifest.json.
          Nodes with coordinates can be displayed as spatial points.
        </p>
      </Dragger>

      {uploadedSummary ? (
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Text type="secondary">{uploadedSummary}</Typography.Text>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={() => {
              void dispatch(clearUploadedAtlasAndSync())
            }}
          >
            Clear uploaded atlas
          </Button>
        </Space>
      ) : null}

      {uploadError ? <Alert type="error" showIcon message={uploadError} /> : null}
    </Space>
  )
}
