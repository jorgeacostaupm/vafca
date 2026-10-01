import snapshotStyles from '@/styles/features/interactive-snapshot.css?raw'
import { appColors } from '@/theme'
import { escapeHtml } from '@/utils/html'
import { cloneSvgWithStyles, downloadBlob, sanitizeFileName } from '@/utils/svgExport'

import { describeDatum, type SnapshotLabels } from './metadata'
import { snapshotRuntime } from './runtime'

type SnapshotOptions = SnapshotLabels & {
  title: string
  groupingTitle: string
  categories: { color: string; values: string[] }[]
}

export function buildInteractiveView(svg: SVGSVGElement, options: SnapshotOptions) {
  const clone = cloneSvgWithStyles(svg)
  const sources = [svg, ...svg.querySelectorAll('*')]
  const targets = [clone, ...clone.querySelectorAll('*')]
  const localIds = new Set(targets.map(element => element.id).filter(Boolean))
  sources.forEach((source, index) => {
    const target = targets[index] as SVGElement
    // Preserve hit areas and hidden overlays, which static SVG export does not need.
    const style = getComputedStyle(source)
    for (const property of ['pointer-events', 'display', 'visibility', 'overflow']) {
      target.style.setProperty(property, style.getPropertyValue(property))
    }
    // Computed gradient/clip URLs may contain the application's absolute URL.
    target.setAttribute('style', (target.getAttribute('style') ?? '').replace(
      /url\(["']?[^)]*?#([^"')]+)["']?\)/g,
      (reference, id: string) => localIds.has(id) ? `url(#${id})` : reference,
    ))
    const nodeId = source.getAttribute('data-node-id')
    const metadata = describeDatum(nodeId !== null ? { labelId: nodeId } : (source as Element & { __data__?: unknown }).__data__, options)
    if (!metadata || !['rect', 'circle', 'line', 'path', 'text'].includes(source.localName)) return
    target.dataset.snapshotIds = JSON.stringify(metadata.ids)
    target.dataset.snapshotTooltip = metadata.html
    if (style.pointerEvents !== 'none') {
      target.setAttribute('tabindex', '0')
      target.setAttribute('role', 'button')
      const label = document.createElement('div')
      label.innerHTML = metadata.html
      target.setAttribute('aria-label', label.textContent ?? '')
    }
  })
  clone.querySelectorAll('.brush, .heatmap-brush, .node-link-brush').forEach(element => element.remove())
  const rect = svg.getBoundingClientRect()
  if (!clone.getAttribute('viewBox')) clone.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
  clone.setAttribute('width', String(rect.width))
  clone.setAttribute('height', String(rect.height))
  const legend = document.createElement('ul')
  for (const category of options.categories) {
    const item = document.createElement('li')
    const swatch = document.createElement('span')
    swatch.style.color = category.color
    swatch.textContent = '● '
    item.append(swatch, category.values.join(' · '))
    legend.append(item)
  }
  return `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(options.title)}</title>
<style>:root{--snapshot-muted-opacity:${INTERACTIVE_EXPORT_MUTED_OPACITY};${Object.entries(appColors).map(([key, value]) => `--snapshot-${key}:${value}`).join(";")}}${snapshotStyles}</style><body><h1>${escapeHtml(options.title)}</h1>
<p>Hover or focus to highlight and inspect values. Click or press Enter to pin. Escape clears highlighting.</p>
<button type="button">Clear highlighting</button><main>${new XMLSerializer().serializeToString(clone)}</main>
${options.groupingTitle && options.categories.length ? `<aside><h2>${escapeHtml(options.groupingTitle)}</h2>${legend.outerHTML}</aside>` : ''}
<div role="tooltip" hidden></div><script>${snapshotRuntime}</script></body></html>`
}

export function exportInteractiveView(svg: SVGSVGElement, options: SnapshotOptions) {
  const html = buildInteractiveView(svg, options)
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${sanitizeFileName(options.title)}.html`)
}
import { INTERACTIVE_EXPORT_MUTED_OPACITY } from '@/config/ui'
