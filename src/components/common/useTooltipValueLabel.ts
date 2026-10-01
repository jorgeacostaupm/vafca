import { useMemo } from 'react'

import { useAppSelector } from '@/store/hooks'
import { selectDatasetContent } from '@/store/slices/dataset'

import { networkTooltipValue } from './networkTooltipValue'
import type { TooltipValueLabel } from './tooltipValueLabel'

export function useTooltipValueLabel(networkId: string, networkLabel: string): TooltipValueLabel {
  const dataset = useAppSelector(selectDatasetContent)
  return useMemo(() => {
    return networkTooltipValue(dataset, networkId, networkLabel)
  }, [dataset, networkId, networkLabel])
}
