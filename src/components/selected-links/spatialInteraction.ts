import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';

import { setSharedHoverState, type SharedHoverState } from '@/components/hover/sharedHover';
import { LINKS_3D_CLICK_TOLERANCE, SPATIAL_EDGE_HIT_PADDING, SPATIAL_EMPHASIS_WIDTH, SPATIAL_HOVER_COLOR_FACTOR, SPATIAL_TOOLTIP_OFFSET } from '@/config/ui';
import { VISUAL_HIGHLIGHT_COLOR } from '@/theme';
import type { SelectedLink } from '@/types/visualizationUi';

type Args = {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  camera: THREE.PerspectiveCamera;
  nodes: Map<string, THREE.Mesh>;
  links: THREE.Group;
  labels: () => Record<string, string>;
  select: (link: SelectedLink) => void;
  atlasMeshes?: THREE.Mesh[];
  onHover?: (hover: SharedHoverState) => void;
  selectNode?: (id: string) => void;
  nodeTooltip?: (id: string) => string;
  linkTooltip?: (link: SelectedLink) => string;
  getHighlightColor?: (link: SelectedLink | undefined, nodeId: string | undefined) => string;
};

export function bindSpatialInteraction({ container, canvas, camera, nodes, links, labels, select,
  getHighlightColor, linkTooltip, atlasMeshes = [], selectNode, nodeTooltip, onHover = setSharedHoverState }: Args) {
  const raycaster = new THREE.Raycaster();
  raycaster.params.Line2 = { threshold: SPATIAL_EDGE_HIT_PADDING };
  const pointer = new THREE.Vector2();
  const tooltip = document.createElement('div');
  tooltip.className = 'atlas-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.style.opacity = '0';
  container.appendChild(tooltip);
  let hovered: THREE.Object3D | null = null;
  let down: { x: number; y: number; pointerId: number; dragged: boolean } | null = null;
  const emphasize = (object: THREE.Object3D | null, active: boolean) => {
    if (!(object instanceof THREE.Mesh) || atlasMeshes.includes(object)) return;
    const material = object.material as THREE.MeshStandardMaterial;
    object.userData.displayColor ??= material.color.clone();
    material.color.copy(object.userData.displayColor).multiplyScalar(active ? SPATIAL_HOVER_COLOR_FACTOR : 1);
    if (active && getHighlightColor) material.color.set(getHighlightColor(object.userData.link, object.userData.nodeId));
    if (object instanceof Line2) {
      if (active && !getHighlightColor) object.material.color.set(VISUAL_HIGHLIGHT_COLOR);
      object.material.linewidth = object.userData.width * (active ? SPATIAL_EMPHASIS_WIDTH : 1);
    } else material.opacity = active ? 1 : (object.userData.displayOpacity ?? object.userData.baseOpacity ?? material.opacity);
  };
  const clearHover = () => {
    emphasize(hovered, false); hovered = null;
    tooltip.style.opacity = '0'; canvas.style.cursor = 'default';
    onHover(null);
  };
  const pick = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    // Anatomical surfaces are context; only markers and links receive pointer interaction.
    return raycaster.intersectObjects([...new Set(nodes.values())].filter(mesh => mesh.visible && !atlasMeshes.includes(mesh)), false)[0]?.object
      ?? raycaster.intersectObjects(links.children.filter(line => line.visible), false)[0]?.object ?? null;
  };
  const move = (event: PointerEvent) => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > LINKS_3D_CLICK_TOLERANCE) down.dragged = true;
    if (event.buttons) { clearHover(); return; }
    const hit = pick(event);
    if (hovered !== hit) { clearHover(); hovered = hit; emphasize(hit, true); }
    if (!hit) return;
    const link = hit.userData.link as SelectedLink | undefined;
    onHover(link ? { type: 'cell', rowId: link.rowId, colId: link.colId } : { type: 'node', nodeId: hit.userData.nodeId });
    tooltip.textContent = link
      ? `${link.rowLabel} — ${link.colLabel}: ${link.sources.map(source => source.value.toFixed(4)).join('; ')}`
      : nodeTooltip?.(hit.userData.nodeId) ?? labels()[hit.userData.nodeId] ?? hit.userData.nodeId;
    if (link && linkTooltip) tooltip.innerHTML = linkTooltip(link);
    tooltip.style.opacity = '1'; canvas.style.cursor = 'pointer';
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${Math.max(0, Math.min(event.clientX - rect.left + SPATIAL_TOOLTIP_OFFSET, rect.width - tooltip.offsetWidth))}px`;
    tooltip.style.top = `${Math.max(0, Math.min(event.clientY - rect.top + SPATIAL_TOOLTIP_OFFSET, rect.height - tooltip.offsetHeight))}px`;
  };
  const pointerDown = (event: PointerEvent) => {
    down = event.button === 0 ? { x: event.clientX, y: event.clientY, pointerId: event.pointerId, dragged: false } : null;
  };
  const pointerUp = (event: PointerEvent) => {
    const start = down; down = null;
    if (!start || start.pointerId !== event.pointerId || start.dragged || Math.hypot(event.clientX - start.x, event.clientY - start.y) > LINKS_3D_CLICK_TOLERANCE) return;
    const hit = pick(event);
    if (hit instanceof Line2) select(hit.userData.link);
    else if (hit?.userData.vafcaRoiId || hit?.userData.nodeId) selectNode?.(hit.userData.vafcaRoiId ?? hit.userData.nodeId);
  };
  const cancel = () => { down = null; clearHover(); };
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerleave', cancel);
  canvas.addEventListener('pointercancel', cancel);
  return {
    refresh() {
      if (hovered instanceof Line2 && !links.children.includes(hovered)) clearHover();
      if (hovered && !hovered.visible) clearHover();
      emphasize(hovered, true);
    },
    reset: clearHover,
    dispose() {
      clearHover();
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', cancel); canvas.removeEventListener('pointercancel', cancel);
      tooltip.remove();
    },
  };
}
