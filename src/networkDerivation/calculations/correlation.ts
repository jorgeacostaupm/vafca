import type { MatrixCellValue, Network } from '@/types/network'
import { materializeNetworkMatrix } from '@/utils/networkData'

import { assertContextCompatible } from './resolution'

export type CorrelationMethod = 'pearson'
export type CorrelationSummary = {
  method: CorrelationMethod
  r: number
  totalLinks: number
  validLinks: number
  excludedLinks: number
}

export function calculateCorrelation(left: Network, right: Network, method: CorrelationMethod = 'pearson') {
  assertContextCompatible([left, right], { allowDifferentMeasures: true })
  if (method !== 'pearson') throw new Error('Unsupported correlation method.')
  // Explicit nulls remain missing even when an imported matrix declares a numeric fallback.
  const materialize = (network: Network) => materializeNetworkMatrix(network.data.format === 'matrix'
    ? { ...network, data: { ...network.data, missingValue: null } } : network)
  const a = materialize(left)
  const b = materialize(right)
  const size = left.nodeIds.length
  const pairs: { i: number; j: number; x: number; y: number }[] = []
  let scaleX = 0
  let scaleY = 0
  for (let i = 0; i < size; i++) for (let j = i + 1; j < size; j++) {
    const x = a[i][j], y = b[i][j]
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    pairs.push({ i, j, x, y })
    scaleX = Math.max(scaleX, Math.abs(x))
    scaleY = Math.max(scaleY, Math.abs(y))
  }
  if (pairs.length < 2) throw new Error('Correlation requires at least two valid corresponding links.')
  // Scaling before centering avoids overflow for large finite input values.
  const xs = pairs.map(({ x }) => x / (scaleX || 1))
  const ys = pairs.map(({ y }) => y / (scaleY || 1))
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value / values.length, 0)
  // Center relative to an observed value to preserve small differences near a large mean.
  const shiftedX = xs.map((x) => x - xs[0]), shiftedY = ys.map((y) => y - ys[0])
  const meanX = mean(shiftedX), meanY = mean(shiftedY)
  const dx = shiftedX.map((x) => x - meanX), dy = shiftedY.map((y) => y - meanY)
  const norm = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0))
  const sx = norm(dx), sy = norm(dy)
  if (xs.every((x) => x === xs[0]) || ys.every((y) => y === ys[0]) || sx === 0 || sy === 0) {
    throw new Error('Correlation is undefined: Network A or Network B has zero variance.')
  }
  const data: MatrixCellValue[][] = Array.from({ length: size }, () => Array<MatrixCellValue>(size).fill(null))
  let r = 0
  pairs.forEach(({ i, j }, k) => {
    const contribution = (dx[k] / sx) * (dy[k] / sy)
    data[i][j] = data[j][i] = contribution
    r += contribution
  })
  if (!Number.isFinite(r) || Math.abs(r) > 1 + 1e-12) throw new Error('Correlation could not be computed reliably.')
  r = Math.max(-1, Math.min(1, r))
  const totalLinks = size * (size - 1) / 2
  const summary: CorrelationSummary = { method, r, totalLinks, validLinks: pairs.length, excludedLinks: totalLinks - pairs.length }
  return { data, summary }
}
