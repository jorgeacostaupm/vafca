import { Alert, Collapse, Modal, Typography } from 'antd'
import { useMemo, useState } from 'react'

import OrderingFieldsSelect from '@/components/network/settings/OrderingFieldsSelect'
import { buildNodeGroupsFromMetadata } from '@/networkDerivation/aggregation/nodeGroupAggregation'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'
import {
  aggregateNetworkView,
  type AggregateNetworkViewRequest,
} from '@/store/slices/networkVisualization/thunks/aggregateNetworkView'

import AggregateGroupLabelsEditor from './AggregateGroupLabelsEditor'

export default function AggregateNetworkModal({
  request,
  onClose,
}: {
  request: Omit<AggregateNetworkViewRequest, 'fields'>
  onClose: () => void
}) {
  const dispatch = useAppDispatch()
  const dataset = useAppSelector(selectDatasetContent)
  const defaultFields = useAppSelector((state) => state.atlasUi.aggregationFields)
  const [fields, setFields] = useState(defaultFields)
  const [groupLabels, setGroupLabels] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const groups = useMemo(() => {
    if (!dataset || fields.length === 0) return []
    return buildNodeGroupsFromMetadata({
      nodeSet: dataset.nodeSet,
      fields,
      activeNodeIds: new Set([...request.snapshot.rowLabels, ...request.snapshot.colLabels]),
      missingTagPolicy: 'unknown_group',
    }).groups
  }, [dataset, fields, request.snapshot])

  const handleCreate = async () => {
    setPending(true)
    setError(null)
    try {
      await dispatch(aggregateNetworkView({ ...request, fields, groupLabels })).unwrap()
      onClose()
    } catch (reason) {
      setError(typeof reason === 'string' ? reason : 'Failed to aggregate network.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open
      title="Aggregate network"
      okText="Create network"
      confirmLoading={pending}
      okButtonProps={{ disabled: fields.length === 0 || groups.length < 2 }}
      cancelButtonProps={{ disabled: pending }}
      closable={!pending}
      maskClosable={!pending}
      keyboard={!pending}
      onCancel={onClose}
      onOk={() => void handleCreate()}
    >
      <Typography.Paragraph>
        Group visible nodes by metadata. Connections use the mean of visible links between groups.
      </Typography.Paragraph>
      <OrderingFieldsSelect
        fields={fields}
        onChange={(next) => {
          setFields(next)
          setError(null)
        }}
      />
      <Typography.Paragraph>
        {groups.length} groups
        {groups.length < 2 ? ' — select fields that produce at least two groups.' : '.'}
      </Typography.Paragraph>
      {groups.length > 0 && (
        <Collapse
          ghost
          items={[
            {
              key: 'labels',
              label: 'Customize group labels',
              children: (
                <AggregateGroupLabelsEditor
                  groups={groups}
                  labels={groupLabels}
                  disabled={pending}
                  onChange={(id, label) =>
                    setGroupLabels((previous) => ({ ...previous, [id]: label }))
                  }
                />
              ),
            },
          ]}
        />
      )}
      {error && <Alert type="error" title={error} showIcon />}
    </Modal>
  )
}
