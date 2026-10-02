import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { networkTooltipValue } from '@/components/common/networkTooltipValue';
import { formatTooltipValue } from '@/components/common/tooltipValueLabel';
import { getSharedHoverState, subscribeSharedHover } from '@/components/hover/sharedHover';
import { SPATIAL_SCENE } from '@/config/ui';
import { useAtlasLabelPresentation } from '@/hooks/useAtlasLabelPresentation';
import { createSpatialScene } from '@/spatial/createSpatialScene';
import { roiTooltip } from '@/spatial/roiTooltip';
import { useSpatialSelection } from '@/spatial/useSpatialSelection';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAtlasDisplayLabelsById } from '@/store/slices/atlasUi';
import { selectDatasetContent } from '@/store/slices/dataset';
import { addSelectedLink, removeSelectedLink } from '@/store/slices/visualizationUi';
import { selectSelectedLinksById } from '@/store/slices/visualizationUi/annotationSelectors';
import type { AtlasDefinition } from '@/types/atlas';
import type { SelectedLink } from '@/types/visualizationUi';
import { escapeHtml } from '@/utils/html';
import { findSelectedLinkId } from '@/utils/selectedLinkKeys';
import { useWorkspaceCamera } from '@/workspace/useWorkspaceCamera';

import { bindSpatialInteraction } from './spatialInteraction';
import { populateSpatialLinks } from './spatialLinks';

type Props = {
  atlasDefinition: AtlasDefinition | null;
  has3d: boolean;
  spatialMode: 'none' | 'geometry' | 'points';
  isNetworkView: boolean;
  hideInactiveRois: boolean;
  highlightedNodeIds: Set<string>;
  activeLinks: SelectedLink[];
  networkDiverging?: boolean;
};

export function useLinksAtlasScene({ atlasDefinition, has3d, spatialMode, isNetworkView,
  hideInactiveRois, highlightedNodeIds, activeLinks, networkDiverging }: Props) {
  const dispatch = useAppDispatch();
  const { nodeColors } = useAtlasLabelPresentation();
  const hasGrouping = useAppSelector(state => state.atlasUi.colorFields.length > 0);
  const visualStyle = useAppSelector(state => state.visualizationUi.spatialVisualStyle);
  const selected = useAppSelector(selectSelectedLinksById);
  const labels = useAppSelector(selectAtlasDisplayLabelsById);
  const dataset = useAppSelector(selectDatasetContent);
  const selection = useSpatialSelection();
  const latest = useRef({ selected, labels, dataset, selection });
  useEffect(() => { latest.current = { selected, labels, dataset, selection }; });
  const diverging = networkDiverging ?? (activeLinks.some(link => link.sources.some(source => source.value < 0))
    && activeLinks.some(link => link.sources.some(source => source.value > 0)));
  const bindCamera = useWorkspaceCamera('links');
  const scene = useRef<ReturnType<typeof createSpatialScene> | null>(null);
  const interactionRef = useRef<ReturnType<typeof bindSpatialInteraction> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!has3d || !container || !atlasDefinition?.nodes.length) return;
    const view = createSpatialScene(container, atlasDefinition, spatialMode);
    scene.current = view;
    const unbindCamera = isNetworkView ? undefined : bindCamera.current(view.camera, view.controls);
    const byId = new Map(atlasDefinition.nodes.map(node => [node.id, node]));
    const interaction = bindSpatialInteraction({ container, canvas: view.renderer.domElement,
      camera: view.camera, nodes: view.nodes, links: view.linksGroup, atlasMeshes: view.atlasView.meshes,
      labels: () => latest.current.labels,
      nodeTooltip: id => roiTooltip(byId.get(id), id),
      selectNode: isNetworkView ? id => latest.current.selection.selectNode(id) : undefined,
      getHighlightColor: (link, nodeId) => {
        const { colors, color } = latest.current.selection;
        return (link ? colors.links[`${link.rowId}::${link.colId}`] : nodeId ? colors.nodes[nodeId] : undefined) ?? color;
      },
      linkTooltip: link => `<div>${escapeHtml(link.rowLabel)} ↔ ${escapeHtml(link.colLabel)}</div>` +
        link.sources.map(source => formatTooltipValue(networkTooltipValue(latest.current.dataset, source.compoundId, source.networkLabel), source.value, link.rowId, link.colId)).join(''),
      select: link => {
        if (!isNetworkView) return;
        const id = findSelectedLinkId(latest.current.selected, link.rowId, link.colId);
        dispatch(id !== undefined ? removeSelectedLink(id) : addSelectedLink(link));
      },
    });
    interactionRef.current = interaction;
    const unsubscribe = subscribeSharedHover(hover => isNetworkView && view.atlasView.update(latest.current.selection.color, hover?.type === 'node' ? hover.nodeId : null, undefined, latest.current.selection.incident, latest.current.selection.colors.nodes));
    return () => { unsubscribe(); interaction.dispose(); unbindCamera?.(); view.dispose(); scene.current = null; interactionRef.current = null; };
  }, [atlasDefinition, has3d, spatialMode, bindCamera, isNetworkView, dispatch]);

  useEffect(() => {
    const view = scene.current;
    if (!view) return;
    const enabled = Object.fromEntries((atlasDefinition?.nodes ?? []).map(node =>
      [node.id, highlightedNodeIds.has(node.id) || (isNetworkView && (selection.selected.has(node.id) || selection.incident.has(node.id)))]));
    for (const mesh of view.pointMeshes) {
      const id = mesh.userData.nodeId as string;
      const active = highlightedNodeIds.has(id);
      // Three.js scene objects are imperative, not React state.
      // eslint-disable-next-line react-hooks/immutability
      mesh.visible = isNetworkView
        ? !hideInactiveRois || active || selection.selected.has(id) || selection.incident.has(id)
        : active;
      mesh.userData.displayVisible = mesh.visible;
      enabled[id] = mesh.visible;
      const material = mesh.material as THREE.MeshStandardMaterial;
      const defaultColor = diverging ? visualStyle.divergingNodeColor : visualStyle.nodeColor;
      material.color.set(selection.selected.has(id) ? selection.colors.nodes[id] : hasGrouping ? nodeColors[id] ?? defaultColor : defaultColor);
      const dimmed = !active && (!isNetworkView || (highlightedNodeIds.size > 0 && !selection.selected.has(id)));
      material.opacity = dimmed ? SPATIAL_SCENE.inactivePointOpacity : mesh.userData.baseOpacity;
      mesh.userData.displayOpacity = material.opacity;
      mesh.userData.displayColor = material.color.clone();
      mesh.userData.displayEmissive = material.emissive.clone();
    }
    const hover = getSharedHoverState();
    const surfaceColors = isNetworkView ? selection.colors.nodes
      : Object.fromEntries(Object.entries(selection.colors.nodes).filter(([id]) => highlightedNodeIds.has(id)));
    view.atlasView.update(selection.color, hover?.type === 'node' ? hover.nodeId : null,
      hideInactiveRois ? enabled : {}, isNetworkView ? selection.incident : highlightedNodeIds, surfaceColors);
    interactionRef.current?.refresh();
  }, [highlightedNodeIds, spatialMode, has3d, atlasDefinition, isNetworkView, hideInactiveRois, visualStyle, diverging, hasGrouping, nodeColors, selection]);

  useEffect(() => {
    const view = scene.current;
    if (!view) return;
    populateSpatialLinks(view.linksGroup, view.centers, activeLinks, visualStyle, selected, selection.color, diverging,
      view.renderer.getSize(new THREE.Vector2()), selection.colors.links);
    interactionRef.current?.refresh();
  }, [activeLinks, spatialMode, has3d, atlasDefinition, visualStyle, selected, selection.color, selection.colors.links, diverging]);

  return { containerRef, applyCameraPose: (x: number, y: number, z: number) => {
    interactionRef.current?.reset(); scene.current?.pose(x, y, z);
  } };
}
