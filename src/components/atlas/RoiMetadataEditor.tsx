import { Alert, Form, Input, Modal } from 'antd'
import { useState } from 'react'

import { DEFAULT_ATLAS_MANAGEMENT_MODAL_WIDTH } from '@/config/ui'
import { updateRoiMetadata } from '@/store/actions/updateRoiMetadata'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { parseMetadataValue } from '@/utils/atlas/nodeMetadata'

import { useActiveAtlasDefinition } from './hooks/useActiveAtlasDefinition'

export default function RoiMetadataEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const dispatch = useAppDispatch()
  const atlas = useActiveAtlasDefinition()
  const nodeSetId = useAppSelector((state) => state.dataset.nodeSet?.id ?? null)
  const metadata = atlas?.nodes.find((node) => node.id === id)?.metadata ?? {}
  const [initialMetadata] = useState(metadata)
  const [values, setValues] = useState(() => Object.entries(metadata).map(([key, value]) => ({
    key, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
  })))
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    try {
      if (!atlas || JSON.stringify(metadata) !== JSON.stringify(initialMetadata)) {
        throw new Error('ROI metadata changed. Close and reopen the editor to load the current values.')
      }
      const updated = Object.fromEntries(values.map(({ key, text }) => {
        try { return [key, parseMetadataValue(text, initialMetadata[key])] }
        catch { throw new Error(`Invalid value for "${key}". Keep the original type; lists and objects must use valid JSON.`) }
      }))
      dispatch(updateRoiMetadata({ id, atlasId: atlas.id, nodeSetId, metadata: updated }))
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save metadata.')
    }
  }

  return (
    <Modal open title="Edit ROI metadata" onCancel={onClose} onOk={save} okText="Save"
      width={DEFAULT_ATLAS_MANAGEMENT_MODAL_WIDTH}>
      {error && <Alert type="error" message={error} showIcon />}
      <Form layout="vertical">
        {values.map(({ key, text }, index) => (
          <Form.Item key={key} label={key} htmlFor={`roi-metadata-${id}-${index}`}>
            <Input.TextArea id={`roi-metadata-${id}-${index}`} value={text}
              onChange={(event) => setValues((current) => current.map((field, fieldIndex) =>
                fieldIndex === index ? { ...field, text: event.target.value } : field))} />
          </Form.Item>
        ))}
      </Form>
    </Modal>
  )
}
