// ponytail: the snapshot only needs hover/focus and pinned highlighting; no application runtime.
export const snapshotRuntime = `
const tooltipGap = ${INTERACTIVE_EXPORT_TOOLTIP_GAP};
const svg = document.querySelector('svg');
const tooltip = document.querySelector('[role="tooltip"]');
const marks = [...svg.querySelectorAll('[data-snapshot-ids]')];
let pinned = null;
function show(mark, x, y) {
  const ids = JSON.parse(mark.dataset.snapshotIds);
  // ponytail: O(n) per hover; use an adjacency index if large snapshots need it.
  for (const other of marks) {
    const theirs = JSON.parse(other.dataset.snapshotIds);
    const related = ids.length === 1 ? theirs.includes(ids[0])
      : theirs.length === 1 ? ids.includes(theirs[0])
      : theirs.every(id => ids.includes(id));
    other.classList.toggle('snapshot-muted', !related);
    other.classList.toggle('snapshot-highlight', related);
  }
  tooltip.innerHTML = mark.dataset.snapshotTooltip;
  tooltip.hidden = false;
  tooltip.style.left = Math.max(0, Math.min(x + tooltipGap, innerWidth - tooltip.offsetWidth - tooltipGap)) + 'px';
  tooltip.style.top = Math.max(0, Math.min(y + tooltipGap, innerHeight - tooltip.offsetHeight - tooltipGap)) + 'px';
}
function reset() {
  pinned = null;
  tooltip.hidden = true;
  for (const mark of marks) mark.classList.remove('snapshot-muted', 'snapshot-highlight');
}
for (const mark of marks) {
  mark.addEventListener('pointerenter', event => show(mark, event.clientX, event.clientY));
  mark.addEventListener('pointermove', event => show(mark, event.clientX, event.clientY));
  mark.addEventListener('pointerleave', () => {
    if (pinned) { const rect = pinned.getBoundingClientRect(); show(pinned, rect.x, rect.y); }
    else reset();
  });
  mark.addEventListener('focus', () => { const rect = mark.getBoundingClientRect(); show(mark, rect.x, rect.y); });
  mark.addEventListener('blur', () => { if (!pinned) reset(); });
  const pin = () => { if (pinned === mark) reset(); else { pinned = mark; const rect = mark.getBoundingClientRect(); show(mark, rect.x, rect.y); } };
  mark.addEventListener('click', pin);
  mark.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pin(); } });
}
document.querySelector('button').addEventListener('click', reset);
document.addEventListener('keydown', event => { if (event.key === 'Escape') reset(); });
`
import { INTERACTIVE_EXPORT_TOOLTIP_GAP } from '@/config/ui'
