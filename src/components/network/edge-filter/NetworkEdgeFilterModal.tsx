import { CheckOutlined, ClearOutlined } from '@ant-design/icons'
import { Button, Modal, Space, Tag, Typography } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import InlineNotice from '@/components/common/InlineNotice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectDatasetData } from '@/store/slices/dataset'
import {
  applyNetworkFilterFromDefinition,
  clearNetworkEdgeFilter,
  resolveNetworkFilterRuntime,
} from '@/store/slices/networkFilters'
import type { NetworkFilterDefinition } from '@/types/edgeFilter'
import {
  cloneNetworkFilterDefinition,
  createEmptyNetworkFilterDefinition,
} from '@/utils/edgeFilter'

import { formatNetworkFilterOptionLabel, formatNetworkSourceTypeLabel } from './edgeFilterLabels'
import NetworkFilterGroupEditor from './NetworkFilterGroupEditor'

type NetworkEdgeFilterModalProps = {
  open: boolean
  onClose: () => void
}

export default function NetworkEdgeFilterModal({ open, onClose }: NetworkEdgeFilterModalProps) {
  const dispatch = useAppDispatch()
  const dataset = useAppSelector((state) => selectDatasetData(state))
  const networkFilters = useAppSelector((state) => state.networkFilters)
  const globalRangeMode = useAppSelector((state) => state.visualizationUi.uiRangeMode)
  const [draft, setCurrentDraft] = useState<NetworkFilterDefinition>(
    () => createEmptyNetworkFilterDefinition(globalRangeMode),
  )
  const activeMask = networkFilters.activeEdgeMask
  const networks = useMemo(
    () => (dataset?.content?.networks ?? []).filter(
      (network) => network.derivation?.type !== 'aggregation',
    ),
    [dataset?.content?.networks],
  )

  useEffect(() => {
    if (!open) return
    // Initialize the editable draft whenever the modal is opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDraft(networkFilters.activeNetworkFilter
      ? {
          ...cloneNetworkFilterDefinition(networkFilters.activeNetworkFilter),
          uiRangeMode: globalRangeMode,
        }
      : createEmptyNetworkFilterDefinition(globalRangeMode))
  }, [globalRangeMode, open, networkFilters.activeNetworkFilter])

  const networkGroups = useMemo(() => {
    const groups = new Map<string, { value: string; label: string; searchText: string }[]>()
    networks.forEach((network) => {
      const group = formatNetworkSourceTypeLabel(network, dataset?.content?.catalogs)
      const label = formatNetworkFilterOptionLabel(network, dataset?.content?.catalogs)
      const option = {
        value: network.id,
        label,
        searchText: `${label} ${network.id} ${Object.values(network.dimensions).join(' ')} ${network.measureId} ${network.statisticId}`,
      }
      groups.set(group, [...(groups.get(group) ?? []), option])
    })
    return ['Population', 'Subject', 'Comparison']
      .filter((label) => groups.has(label))
      .map((label) => ({ label, options: groups.get(label) ?? [] }))
  }, [dataset?.content?.catalogs, networks])

  const runtime = useMemo(
    () =>
      resolveNetworkFilterRuntime({
        mode: 'original',
        definition: draft,
        dataset,
        uiRangeMode: globalRangeMode,
      }),
    [dataset, draft, globalRangeMode],
  )
  const validation = runtime.validation
  const preview = runtime.mask

  const handleApply = () => {
    if (!runtime.edgeDomain || !validation.valid) return
    dispatch(
      applyNetworkFilterFromDefinition({
        mode: 'original',
        definition: draft,
      }),
    )
  }

  const handleClear = () => {
    setCurrentDraft(createEmptyNetworkFilterDefinition(globalRangeMode))
    dispatch(clearNetworkEdgeFilter())
  }

  return (
    <Modal
      title="Filter networks"
      open={open}
      width={1040}
      className="edge-filter-modal"
      onCancel={onClose}
      footer={[
        <Button
          key="apply"
          type="primary"
          icon={<CheckOutlined />}
          disabled={!validation.valid}
          onClick={handleApply}
        >
          Apply
        </Button>,
        <Button key="clear" icon={<ClearOutlined />} onClick={handleClear}>
          Clear
        </Button>,
      ]}
    >
      <div className="edge-filter-modal__content">
        <section className="edge-filter-modal__section">
          <div className="edge-filter-modal__section-header">
            <Typography.Text type="secondary">Build filters for networks and rankings.</Typography.Text>
          </div>

          <NetworkFilterGroupEditor
            group={draft.root}
            isRoot
            networks={networks}
            networkGroups={networkGroups}
            catalogs={dataset?.content?.catalogs}
            uiRangeMode={globalRangeMode}
            onChange={(root) =>
              setCurrentDraft({
                ...draft,
                root,
              })
            }
          />

          <Space size={8} wrap className="edge-filter-modal__status">
            <Tag color={activeMask ? 'success' : 'default'}>
              {activeMask ? 'Active filter' : 'No active filter'}
            </Tag>
            {preview ? (
              <Typography.Text type="secondary">
                Draft matches {preview.selectedCount} / {preview.totalCount} links
                {preview.totalCount > 0
                  ? ` (${((preview.selectedCount / preview.totalCount) * 100).toFixed(1)}%)`
                  : ''}
              </Typography.Text>
            ) : null}
            <Typography.Text type="secondary">Applies to networks and rankings.</Typography.Text>
            {validation.errors.length > 0 ? (
              <InlineNotice
                tone="error"
                label="Filter errors"
                tooltip={
                  <Space direction="vertical" size={4}>
                    {validation.errors.map((issue) => (
                      <span key={issue.id}>{issue.message}</span>
                    ))}
                  </Space>
                }
              />
            ) : null}
            {validation.warnings.length > 0 ? (
              <InlineNotice
                tone="warning"
                label="Filter warnings"
                tooltip={
                  <Space direction="vertical" size={4}>
                    {validation.warnings.map((issue) => (
                      <span key={issue.id}>{issue.message}</span>
                    ))}
                  </Space>
                }
              />
            ) : null}
          </Space>
        </section>
      </div>
    </Modal>
  )
}
