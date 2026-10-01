import type { NetworkCalculationOutputSpec } from './types'

export const absoluteCalculationOutput = (output: NetworkCalculationOutputSpec): NetworkCalculationOutputSpec =>
  output.scaleType === 'diverging' ? {
    ...output,
    statisticId: `absolute_${output.statisticId}`,
    statLabel: `Absolute ${output.statLabel}`,
    operator: `absolute_${output.operator}`,
    labelSuffix: `absolute ${output.labelSuffix}`,
    scaleType: 'sequential',
    center: null,
    rangeMode: 'non_negative_observed',
    expectedRange: null,
    useDataRange: true,
  } : output
