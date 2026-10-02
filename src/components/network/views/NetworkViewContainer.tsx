import { Alert } from 'antd'
import { memo, useCallback, useMemo, useState } from 'react'
import { shallowEqual } from 'react-redux'

import NetworkViewFrame from '@/components/layout/NetworkViewFrame'
import NetworkViewActions from '@/components/network/views/NetworkViewActions'
import NetworkViewDownloadButton from '@/components/network/views/NetworkViewDownloadButton'
import NetworkViewRenderer from '@/components/network/views/NetworkViewRenderer'
import {
  LoadingPanelBody,
  NetworkViewReloadButton,
  NetworkViewStatusContent,
} from '@/components/network/views/NetworkViewStatus'
import { resolveNetworkViewTitle } from '@/components/network/views/networkViewTitle'
import NetworkViewTypeSelector from '@/components/network/views/NetworkViewTypeSelector'
import NetworkViewZoomControls from '@/components/network/views/NetworkViewZoomControls'
import { buildNetworkLinkCandidates, selectNetworkVisibleLinks } from '@/components/network/views/networkVisibleLinks'
import { useNetworkViewModel } from '@/components/network/views/useNetworkViewModel'
import SelectedLinksAtlas from '@/components/selected-links/SelectedLinksAtlas'
import { NETWORK_LINKS_3D_LIMIT } from '@/config/ui'
import { useAtlasDefinition } from '@/hooks/useAtlasDefinition'
import { useAtlasLabelPresentation } from '@/hooks/useAtlasLabelPresentation'
import { useAppSelector } from '@/store/hooks'
import { selectDatasetData } from '@/store/slices/dataset'
import { selectVisibleAnnotationLinks } from '@/store/slices/visualizationUi/annotationSelectors';
import { atlasSupports3d } from '@/utils/atlas/atlasDefinition'
import { getSpatialNodeCenter } from '@/utils/atlas/spatialGeometry'
import { getDatasetAtlasId } from '@/utils/datasetAccessors'

type NetworkViewContainerProps = {
  viewId: string
  onRemove: (id: string) => void
}

function NetworkViewContainer({ viewId, onRemove }: NetworkViewContainerProps) {
  const model = useNetworkViewModel(viewId)
  const [spatialVisible, setSpatialVisible] = useState(false)
  const [spatialControlsContainer, setSpatialControlsContainer] = useState<HTMLDivElement | null>(null)
  const { labelNames } = useAtlasLabelPresentation()
  const dataset = useAppSelector(selectDatasetData)
  const selectedLinks = useAppSelector(selectVisibleAnnotationLinks, shallowEqual)
  const atlas = useAtlasDefinition(getDatasetAtlasId(dataset))
  const spatialNodeIds = useMemo(
    () =>
      new Set(
        atlas?.nodes.flatMap((node) =>
          getSpatialNodeCenter(node, atlas?.spatial) ? [String(node.id), String(node.atlasId)] : [],
        ),
      ),
    [atlas],
  )
  const linkCandidates = useMemo(
    () =>
      model.kind === 'ready'
        ? buildNetworkLinkCandidates(
            model.renderData,
            model.valueFilters,
            model.view.compoundId,
            model.computed.labelNames ?? labelNames,
          )
        : [],
    [model, labelNames],
  )
  const { links, isAutomaticallyFiltered } = useMemo(() => selectNetworkVisibleLinks(linkCandidates, selectedLinks), [linkCandidates, selectedLinks])
  const spatialDisabledReason =
    !atlasSupports3d(atlas)
      ? 'Load an atlas with 3D coordinates to use this view.'
      : links.some((link) => !spatialNodeIds.has(link.rowId) || !spatialNodeIds.has(link.colId))
        ? 'The visible links include nodes without 3D coordinates in the atlas.'
        : model.kind !== 'ready' || model.view.status !== 'ready'
          ? 'Wait for the network to finish loading.'
          : null
  const spatialAvailable = spatialDisabledReason === null
  const handleRemove = useCallback(() => {
    onRemove(viewId)
  }, [onRemove, viewId])

  if (model.kind === 'missing') return null

  if (model.kind === 'loading') {
    return (
      <NetworkViewFrame
        title={model.view.label}
        onRemove={handleRemove}
        actions={<NetworkViewReloadButton viewId={model.view.id} />}
      >
        {model.view.status === 'error' ? (
          <NetworkViewStatusContent
            viewId={model.view.id}
            status={model.view.status}
            error={model.view.error}
          />
        ) : (
          <LoadingPanelBody text={model.view.loadingMessage ?? 'Loading network…'} />
        )}
      </NetworkViewFrame>
    )
  }

  const viewTitle = resolveNetworkViewTitle(model.view.type)

  return (
    <NetworkViewFrame
      title={model.view.label}
      className={model.className}
      toolbar={
        <>
          <div className="network-view-toolbar" role="toolbar" aria-label="Network view controls">
            {!spatialVisible && (
              <div className="network-view-toolbar__group" role="group" aria-label="Export">
                <NetworkViewDownloadButton
                  svgRef={model.svgRef}
                  fileName={`${viewTitle} ${model.view.label}`}
                  networkId={model.view.compoundId}
                  networkLabel={model.view.label}
                  renderData={model.renderData}
                />
              </div>
            )}
            <NetworkViewTypeSelector
              view={model.view}
              spatialVisible={spatialVisible}
              spatialDisabledReason={spatialDisabledReason}
              onSpatialVisibleChange={setSpatialVisible}
            />
            {spatialVisible ? <div className="network-view-toolbar__spatial" ref={setSpatialControlsContainer} /> : (
              <NetworkViewZoomControls computed={model.computed} isMatrixView={model.isMatrixView} spatialVisible={false} />
            )}
            <div className="network-view-toolbar__group" role="group" aria-label="Network actions">
              <NetworkViewActions
                view={model.view}
                computed={model.computed}
                isMatrixView={model.isMatrixView}
                renderData={model.renderData}
                sourceNetworkId={model.networkView.id}
                isAggregatedNetwork={model.isAggregatedNetwork}
                isTemporaryNetwork={model.isTemporaryNetwork}
              />
            </div>
          </div>
          {spatialVisible && spatialAvailable && isAutomaticallyFiltered && (
            <Alert
              type="warning"
              showIcon
              role="status"
              message={`Automatically filtered: keeping the ${NETWORK_LINKS_3D_LIMIT} strongest links by absolute value, plus all selected links.`}
            />
          )}
        </>
      }
      onRemove={handleRemove}
    >
      {spatialVisible && model.view.status === 'ready' ? (
        <div className="network-links-3d">
          {spatialAvailable ? (
            <SelectedLinksAtlas
              networkLinks={links}
              networkDiverging={model.computed.valueDomain.min < 0 && model.computed.valueDomain.max > 0}
              controlsContainer={spatialControlsContainer}
              viewType="circular"
              nodeMode="connected"
              useAtlas3d
              onViewTypeChange={() => setSpatialVisible(false)}
              onNodeModeChange={() => setSpatialVisible(false)}
            />
          ) : (
            <Alert type="info" showIcon message={spatialDisabledReason} />
          )}
        </div>
      ) : (
        <NetworkViewRenderer
          view={model.view}
          computed={model.computed}
          renderData={model.renderData}
          isMatrixView={model.isMatrixView}
          svgRef={model.svgRef}
          valueFilters={model.valueFilters}
        />
      )}
    </NetworkViewFrame>
  )
}

export default memo(NetworkViewContainer)
