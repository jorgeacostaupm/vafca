import { Alert, Button, Modal, Space, Typography, Upload } from 'antd'
import { useState } from 'react'

import { useAppDispatch } from '@/store/hooks'
import { openWorkspace, saveWorkspace } from '@/workspace/thunks'

export default function WorkspaceControls() {
  const dispatch = useAppDispatch()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const run = async (operation: 'save' | 'open') => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (operation === 'save') await dispatch(saveWorkspace()).unwrap()
      else if (file) await dispatch(openWorkspace({ file })).unwrap()
      setNotice(operation === 'save' ? 'Workspace downloaded.' : 'Workspace restored.')
      if (operation === 'open') setFile(null)
    } catch (cause) {
      setError(cause && typeof cause === 'object' && 'message' in cause ? String(cause.message) : 'Workspace operation failed.')
    } finally { setBusy(false) }
  }
  return <Space orientation="vertical">
    <Typography.Paragraph>Save a self-contained analysis with networks, atlas, selected links, filters and open views.</Typography.Paragraph>
    <Space>
      <Button loading={busy} disabled={busy} onClick={() => void run('save')}>Save workspace</Button>
      <Upload accept=".zip" showUploadList={false} disabled={busy} beforeUpload={selected => { setFile(selected); return Upload.LIST_IGNORE }}>
        <Button disabled={busy}>Open workspace</Button>
      </Upload>
    </Space>
    {error && <Alert type="error" showIcon title={error} />}
    {notice && <Alert type="success" showIcon title={notice} />}
    <Modal title="Replace current workspace?" open={Boolean(file)} confirmLoading={busy} closable={!busy} maskClosable={!busy} cancelButtonProps={{ disabled: busy }} onCancel={() => setFile(null)} onOk={() => void run('open')} okText="Open workspace">
      <Typography.Paragraph>Opening {file?.name} replaces the current analysis. Save your workspace first if you want to keep it. An invalid file leaves the current analysis intact.</Typography.Paragraph>
      <Button disabled={busy} onClick={() => void run('save')}>Save current workspace</Button>
      {error && <Alert type="error" title={error} />}
    </Modal>
  </Space>
}
