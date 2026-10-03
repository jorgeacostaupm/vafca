// Run with: node scripts/check-matrix-preview.mjs
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})
try {
  const { default: MatrixPreview } = await server.ssrLoadModule(
    '/src/components/management/components/MatrixHierarchyPreview.tsx',
  )
  const preview = MatrixPreview({
    matrixPreviewIds: ['a', 'b', 'c'],
    nodeColors: { a: 'red', b: 'red', c: 'blue' },
  })
  const svg = preview.props.children
  const [, , width, height] = svg.props.viewBox.split(' ').map(Number)
  assert.equal(width, height, 'The preview must be square')
  const groups = svg.props.children[1]
  assert.equal(groups.length, 2, 'Adjacent nodes with the same color form a block')
  for (const group of groups) {
    const [, horizontal, vertical] = group.props.children
    assert.equal(horizontal.props.x, vertical.props.y, 'Both axes share the order')
    assert.equal(horizontal.props.width, vertical.props.height, 'Both axes share block sizes')
    assert.equal(horizontal.props.height, vertical.props.width)
    assert.ok(horizontal.props.width > 0)
  }
  assert.ok(groups[0].props.children[1].props.width > groups[1].props.children[1].props.width)
  const empty = MatrixPreview({ matrixPreviewIds: [], nodeColors: {} })
  assert.deepEqual(empty.props.children.props.children[1], [])
  console.log('Matrix preview checks passed.')
} finally {
  await server.close()
}
