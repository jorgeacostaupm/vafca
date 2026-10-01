import { CORRELATION_DISPLAY_PRECISION } from '@/config/ui'
import type { NetworkDataset } from '@/types/network'
import { getNetworkValue } from '@/utils/networkData'

import { buildTooltipValueLabel, type TooltipValueLabel } from './tooltipValueLabel'

export function networkTooltipValue(dataset: NetworkDataset | null | undefined, networkId: string, networkLabel: string): TooltipValueLabel {
  const network = dataset?.networkIndex[networkId]
  const derivation = network?.derivation
  if (derivation?.type !== 'comparison' || derivation.operator !== 'pearson_contribution') {
    return buildTooltipValueLabel(networkLabel)
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
