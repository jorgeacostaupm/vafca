import { message } from 'antd'
import { type RefObject, useState } from 'react'

import ChartDownloadButton from '@/components/common/ChartDownloadButton'
import { useTooltipValueLabel } from '@/components/common/useTooltipValueLabel'
import type { buildNetworkViewRenderData } from '@/components/network/views/networkViewData'
import { useAtlasLabelPresentation } from '@/hooks/useAtlasLabelPresentation'
import { useAppSelector } from '@/store/hooks'
import { humanizeFieldName } from '@/utils/atlas/atlasDefinition'
import { exportInteractiveView } from '@/utils/interactiveExport/exportInteractiveView'

type Props = {
  svgRef: RefObject<SVGSVGElement | null>
  fileName: string
  networkId: string
  networkLabel: string
  renderData: ReturnType<typeof buildNetworkViewRenderData>
}

export default function NetworkViewDownloadButton({ svgRef, fileName, networkId, networkLabel, renderData }: Props) {
  const { labelTitles, groupingCategories } = useAtlasLabelPresentation()
  const fields = useAppSelector(state => state.atlasUi.colorFields)
  const valueLabel = useTooltipValueLabel(networkId, networkLabel)
  const [busy, setBusy] = useState(false)
  const [feedback, contextHolder] = message.useMessage()
  const download = async () => {
    if (busy || !svgRef.current) return
    setBusy(true)
    const close = feedback.loading('Preparing interactive view…', 0)
    try {
      // Allow the browser to paint feedback before serializing a large SVG.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      if (!svgRef.current) return
      exportInteractiveView(svgRef.current, {
        title: fileName,
        rows: renderData.type === 'matrix' ? renderData.payload.rowLabels : renderData.payload.labels,
        cols: renderData.type === 'matrix' ? renderData.payload.colLabels : renderData.payload.labels,
        names: labelTitles,
        valueLabel,
        groupingTitle: fields.map(humanizeFieldName).join(' → '),
        categories: groupingCategories,
      })
    } catch {
      void feedback.error('Could not export the interactive view. Please try again.')
    } finally {
      close()
      setBusy(false)
    }
  }
  return <>{contextHolder}<ChartDownloadButton svgRef={svgRef} fileName={fileName} onInteractiveDownload={() => void download()} /></>
}
