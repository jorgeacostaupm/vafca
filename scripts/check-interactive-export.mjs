import assert from 'node:assert/strict'
import vm from 'node:vm'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
try {
  const { describeDatum } = await server.ssrLoadModule('/src/utils/interactiveExport/metadata.ts')
  const { snapshotRuntime } = await server.ssrLoadModule('/src/utils/interactiveExport/runtime.ts')
  const labels = { rows: ['a'], cols: ['b'], names: { a: '<script>bad</script>', b: 'B' }, valueLabel: 'Value' }
  const cell = describeDatum({ row: 0, col: 0, value: -0.5 }, labels)
  assert.deepEqual(cell.ids, ['a', 'b'])
  assert.ok(cell.html.includes('-0.5000'))
  assert.ok(cell.html.includes('&lt;script&gt;'))
  assert.ok(!cell.html.includes('<script>'))
  assert.deepEqual(describeDatum({ rowId: 'a', colId: 'b', value: -0.5 }, labels), cell)
  assert.equal(describeDatum({ row: 0, col: 0, value: NaN }, labels), null)
  assert.equal(describeDatum({ row: 10, col: 0, value: 1 }, labels), null)
  assert.deepEqual(describeDatum({ labelId: 'a' }, labels).ids, ['a'])
  assert.ok(describeDatum({ rowId: 'a', colId: 'b', value: 2 }, {
    ...labels, valueLabel: (value, row, col) => `${row}/${col}: ${value}`,
  }).html.includes('a/b: 2'))

  const mark = (ids, html = 'value') => ({
    dataset: { snapshotIds: JSON.stringify(ids), snapshotTooltip: html },
    classes: new Set(), handlers: {},
    get classList() { return { toggle: (key, enabled) => enabled ? this.classes.add(key) : this.classes.delete(key), remove: (...keys) => keys.forEach(key => this.classes.delete(key)) } },
    addEventListener(name, callback) { this.handlers[name] = callback },
    getBoundingClientRect() { return { x: 20, y: 30 } },
  })
  const node = mark(['a'])
  const link = mark(['a', 'b'], cell.html)
  const unrelated = mark(['c', 'd'])
  const marks = [node, link, unrelated]
  const tooltip = { hidden: true, style: {}, offsetWidth: 100, offsetHeight: 40 }
  const button = mark([])
  const keyboard = {}
  vm.runInNewContext(snapshotRuntime, {
    document: {
      querySelector: selector => selector === 'svg' ? { querySelectorAll: () => marks } : selector === 'button' ? button : tooltip,
      addEventListener: (name, handler) => { keyboard[name] = handler },
    }, innerWidth: 800, innerHeight: 600,
  })
  node.handlers.pointerenter({ clientX: 799, clientY: 599 })
  assert.ok(link.classes.has('snapshot-highlight'), 'Node highlights its incident links')
  assert.ok(unrelated.classes.has('snapshot-muted'))
  assert.equal(tooltip.hidden, false)
  assert.ok(parseInt(tooltip.style.left) <= 700, 'Tooltip stays in viewport')
  link.handlers.click()
  link.handlers.pointerleave()
  assert.equal(tooltip.innerHTML, cell.html, 'Pinned tooltip survives pointer leave')
  keyboard.keydown({ key: 'Escape' })
  assert.equal(tooltip.hidden, true)
  assert.ok(marks.every(item => item.classes.size === 0))
  link.handlers.focus()
  assert.equal(tooltip.hidden, false, 'Keyboard focus exposes values')
  button.handlers.click()
  assert.equal(tooltip.hidden, true)
  console.log('Interactive export checks passed')
} finally {
  await server.close()
}
