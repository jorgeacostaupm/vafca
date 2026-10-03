// Run with: node scripts/check-data-navigation.mjs
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  cacheDir: 'node_modules/.vite-data-navigation-check',
  server: { middlewareMode: true, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
})
try {
  const { default: reducer, patchWorkspaceUi } = await server.ssrLoadModule('/src/workspace/workspaceUiSlice.ts')
  const { sessionSchema } = await server.ssrLoadModule('/src/workspace/sessionSchema.ts')
  const schema = sessionSchema.shape.workspaceUi
  const initial = reducer(undefined, { type: 'check/init' })

  // Saving from Manage data must produce a UI state that Open workspace accepts.
  for (const activeSection of ['vis', 'derive', 'atlas', 'links', 'catalogs', 'data', 'settings']) {
    const state = reducer(initial, patchWorkspaceUi({ activeSection }))
    const restored = schema.parse(JSON.parse(JSON.stringify(state)))
    assert.equal(restored.activeSection, activeSection)
  }
  assert.equal(schema.safeParse({ ...initial, activeSection: 'unknown' }).success, false)
  console.log('Data navigation workspace checks passed.')
} finally {
  await server.close()
}
