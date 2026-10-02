import { CORRELATION_DISPLAY_PRECISION } from '@/config/ui'
import type { NetworkDataset } from '@/types/network'
import { getNetworkValue } from '@/utils/networkData'
import { createNetworkCompoundId } from '@/utils/networkMetadata'

import { buildTooltipValueLabel, type TooltipValueLabel } from './tooltipValueLabel'

export function networkTooltipValue(dataset: NetworkDataset | null | undefined, networkId: string, networkLabel: string): TooltipValueLabel {
  // ponytail: compound IDs require an O(n) lookup per tooltip; index them if hover profiling warrants it.
  const network = dataset?.networkIndex[networkId] ?? dataset?.networks.find(
    candidate => createNetworkCompoundId(candidate) === networkId,
  )
  const derivation = network?.derivation
  if (derivation?.type !== 'comparison' || derivation.operator !== 'pearson_contribution') {
    return network && dataset ? [
      dataset.catalogs.measures[network.measureId]?.label ?? network.measureId,
      dataset.catalogs.statistics[network.statisticId]?.label ?? network.statisticId,
    ].join(' · ') : buildTooltipValueLabel(networkLabel)
  }
  const left = dataset?.networkIndex[derivation.leftNetworkId ?? '']
  const right = dataset?.networkIndex[derivation.rightNetworkId ?? '']
  return (value: number, row: string, col: string) => {
    const signed = value >= 0 ? '+' : ''
    const input = (source: typeof left) => {
      const value = source ? getNetworkValue(source, row, col) : null
      return typeof value === 'number' && Number.isFinite(value) ? value : 'Unavailable'
    }
    return `<div>Correlation contribution: ${signed}${value.toPrecision(CORRELATION_DISPLAY_PRECISION)}</div>` +
      `<div>Network A value: ${input(left)}</div>` +
      `<div>Network B value: ${input(right)}</div>`
  }
}
