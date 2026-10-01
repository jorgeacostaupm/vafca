import { FilterOutlined } from '@ant-design/icons'
import { Button, Divider, Popover } from 'antd'
import { useState } from 'react'

import NetworkFilterRolePopover from '@/components/network/NetworkFilterRolePopover'
import type { buildNetworkViewRenderData } from '@/components/network/views/networkViewData'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  patchNetworkMatrixSettings,
  patchNetworkNodeLinkSettings,
  selectNetworkControls,
  updateNetworkViewStatRange,
} from '@/store/slices/networkVisualization'
import type { AggregateNetworkViewRequest } from '@/store/slices/networkVisualization/thunks/aggregateNetworkView'
import type { MatrixBrushMode } from '@/types/matrixHeatmap'
import type { ComputedView, SharedNetworkViewSettings } from '@/types/networkVisualization'

import AggregateNetworkModal from './AggregateNetworkModal'
import EditAggregatedGroupLabels from './EditAggregatedGroupLabels'

type SharedPanelSettingsPatch = Partial<
  SharedNetworkViewSettings & { brushEnabled: boolean; brushMode: MatrixBrushMode }
>

type NetworkViewActionsProps = {
  view: ComputedView['view']
  computed: ComputedView
  renderData: ReturnType<typeof buildNetworkViewRenderData>
  isMatrixView: boolean
  sourceNetworkId: string
  isAggregatedNetwork: boolean
  isTemporaryNetwork: boolean
}

export default function NetworkViewActions({
  view,
  computed,
  renderData,
  isMatrixView,
  sourceNetworkId,
  isAggregatedNetwork,
  isTemporaryNetwork,
}: NetworkViewActionsProps) {
  const dispatch = useAppDispatch()
  const networkControls = useAppSelector(selectNetworkControls)
  const [aggregationRequest, setAggregationRequest] = useState<Omit<AggregateNetworkViewRequest, 'fields'> | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const aggregationDisabledReason = isAggregatedNetwork
    ? 'Aggregated networks cannot be aggregated again'
    : null
  const patchSharedSettings = (patch: SharedPanelSettingsPatch) => {
    if (isMatrixView) {
      dispatch(
        patchNetworkMatrixSettings({
          viewId: view.id,
          patch,
        }),
      )
      return
    }

    dispatch(
      patchNetworkNodeLinkSettings({
        viewId: view.id,
        patch,
      }),
    )
  }

  const filterContent = (
    <NetworkFilterRolePopover
      statRangeValue={computed.statRangeValue}
      hasNegativeRange={computed.hasNegativeRange}
      statCenter={computed.valueDomain.center ?? 0}
      statSliderMin={computed.statSliderMin}
      statSliderMax={computed.statSliderMax}
      onStatRangeChange={(value, segment, enabled) =>
        dispatch(
          updateNetworkViewStatRange({
            viewId: view.id,
            value,
            segment,
            enabled,
            fallback: computed.statRangeValue,
          }),
        )
      }
      useAsNodeFilter={computed.useAsNodeFilter}
      onUseAsNodeFilterChange={(checked) => patchSharedSettings({ useAsNodeFilter: checked })}
      useAsLinkFilter={computed.useAsLinkFilter}
      onUseAsLinkFilterChange={(checked) => patchSharedSettings({ useAsLinkFilter: checked })}
      percentLinkFilter={computed.percentLinkFilter}
      includeAutoconnections={networkControls.percentZoomIncludeAutoconnections}
      onPercentLinkFilterChange={(percentLinkFilter) => patchSharedSettings({ percentLinkFilter })}
    />
  )
  const handleAggregate = () => {
    const snapshot =
      renderData.type === 'matrix'
        ? {
            data: renderData.payload.data,
            rowLabels: renderData.payload.rowLabels,
            colLabels: renderData.payload.colLabels,
            symmetric: computed.symmetric,
          }
        : {
            data: renderData.payload.data,
            rowLabels: renderData.payload.labels,
            colLabels: renderData.payload.labels,
            symmetric: computed.symmetric,
          }

    setFilterOpen(false)
    setAggregationRequest({
      sourceViewId: view.id,
      sourceNetworkId,
      sourceViewType: view.type,
      snapshot,
    })
  }

  return (
    <div className="network-view-actions">
      {aggregationRequest && (
        <AggregateNetworkModal request={aggregationRequest} onClose={() => setAggregationRequest(null)} />
      )}
      {isTemporaryNetwork && <EditAggregatedGroupLabels viewId={view.id} />}
      {!isTemporaryNetwork ? (
        <Popover
          open={filterOpen}
          onOpenChange={setFilterOpen}
          content={
            <div className="network-view-filter-menu">
              {filterContent}
              <Divider />
              <Button
                className="network-view-filter-menu__aggregate"
                size="small"
                type="text"
                aria-label="Aggregate network"
                title={aggregationDisabledReason ?? 'Aggregate network'}
                disabled={aggregationDisabledReason !== null}
                onClick={handleAggregate}
              >
                Aggregate network
              </Button>
            </div>
          }
          trigger="click"
          placement="rightTop"
          destroyTooltipOnHide
        >
          <Button
            size="small"
            type={computed.useAsNodeFilter || computed.useAsLinkFilter ? 'default' : 'text'}
            aria-label="Filter role settings"
            icon={<FilterOutlined />}
          />
        </Popover>
      ) : null}
    </div>
  )
}
