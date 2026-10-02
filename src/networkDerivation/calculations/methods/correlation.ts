import { buildNetworkSummaryLabel } from '@/utils/matrixViewUtils'

import { calculateCorrelation } from '../correlation'
import { correlationCatalogEntries, correlationInput } from '../correlationCatalogs'
import { maybePush } from '../methodRuntime'
import { createDerivedNetwork } from '../records'
import type { NetworkCalculationMethod } from '../types'

export const correlation: NetworkCalculationMethod = {
  definition: {
    id: 'correlation', label: 'Pearson correlation', shortLabel: 'Pearson',
    scope: 'network_vs_network', category: 'group_comparison',
    description: 'Compare global topographical similarity and derive each connection’s contribution to Pearson r.',
    formulaText: 'cᵢ = (xᵢ − x̄)(yᵢ − ȳ) / (Sₓ Sᵧ); r = Σcᵢ',
    interpretation: 'Signed connection contributions sum to the global correlation over unique valid links.',
    requirements: ['Compatible networks', 'At least two finite pairs', 'Nonzero variance'],
    requiredInputs: [], requiresControlOrReference: true,
    outputs: [{ statisticId: 'pearson_contribution', statLabel: 'Correlation contribution', statCategory: 'comparison',
      operator: 'pearson_contribution', comparisonType: 'network_vs_network', labelSuffix: 'Pearson contribution',
      units: null, scaleType: 'diverging', center: 0, rangeMode: 'observed_symmetric', useDataRange: true }],
  },
  calculate: ({ request, state, result }) => {
    const left = state.networkIndex[request.correlationNetworkAId ?? '']
    const right = state.networkIndex[request.correlationNetworkBId ?? '']
    if (!left || !right) { result.warnings.push('Select Network A and Network B.'); return }
    try {
      const existing = Object.values(state.networkIndex).find(network => {
        const derivation = network.derivation
        return derivation?.type === 'comparison' && derivation.operator === 'pearson_contribution' &&
          ((derivation.leftNetworkId === left.id && derivation.rightNetworkId === right.id) ||
            (derivation.leftNetworkId === right.id && derivation.rightNetworkId === left.id))
      })
      if (existing) {
        result.existing.push(existing)
        result.warnings.push('This correlation has already been calculated. No new network was created.')
        return
      }
      const { data, summary } = calculateCorrelation(left, right)
      const inputs: [ReturnType<typeof correlationInput>, ReturnType<typeof correlationInput>] = [correlationInput(left), correlationInput(right)]
      const entries = correlationCatalogEntries(inputs, state.catalogs)
      const id = `correlation:${encodeURIComponent(JSON.stringify([left.id, right.id].sort()))}:pearson`
      maybePush(createDerivedNetwork({
        id, label: buildNetworkSummaryLabel({ ...inputs[0], comparisonInputs: inputs }, state.catalogs),
        sourceId: entries.source.id, dimensions: Object.fromEntries(Object.entries(entries.aspects).map(([key, item]) => [key, item.id])),
        measureId: entries.measure.id,
        nodeSetId: left.nodeSetId, nodeIds: left.nodeIds, statisticId: entries.statistic.id,
        derivation: { type: 'comparison', operator: 'pearson_contribution', comparisonType: 'network_vs_network',
          formula: '(x_i - mean_x) / S_x * (y_i - mean_y) / S_y', leftNetworkId: left.id, rightNetworkId: right.id,
          inputs,
          parameters: { ...summary, sourceGrouping: 'endpoints', left: left.sourceId, right: right.sourceId } },
        valueDomain: { min: null, max: null, center: 0, units: null },
        dependencies: [left.id, right.id], provenanceParameters: { ...summary }, data,
      }), state, result)
    } catch (error) {
      result.warnings.push(error instanceof Error ? error.message : 'Correlation failed.')
    }
  },
}
