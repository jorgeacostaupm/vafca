import { type RefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { bindSpatialInteraction } from '@/components/selected-links/spatialInteraction';
import { ATLAS_PANEL_INACTIVE_NODE_OPACITY } from '@/config/ui';
import { useAtlasLabelPresentation } from '@/hooks/useAtlasLabelPresentation';
import { createSpatialScene } from '@/spatial/createSpatialScene';
import { roiTooltip } from '@/spatial/roiTooltip';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAtlasPanelState } from '@/store/slices/visualizationUi';
import { appColors } from '@/theme';
import type { AtlasDefinition } from '@/types/atlas';
import { useWorkspaceCamera } from '@/workspace/useWorkspaceCamera';

type Args = {
  atlasDefinition: AtlasDefinition | null;
  enabledById: Record<string, boolean>;
  displayLabelsById: Record<string, string>;
  containerRef: RefObject<HTMLDivElement | null>;
  enable3d: boolean;
};

export function useAtlasScene({ atlasDefinition, enabledById, displayLabelsById, containerRef, enable3d }: Args) {
  const dispatch = useAppDispatch();
  const spatialMode = useAppSelector(state => state.visualizationUi.atlasPanel.spatialMode === 'points' ? 'points' : 'geometry');
  const showInactive = useAppSelector(state => state.visualizationUi.atlasPanel.showInactiveNodes);
  const { nodeColors } = useAtlasLabelPresentation();
  const listHovered = useAppSelector(state => state.visualizationUi.atlasPanel.hoveredNodeId ?? null);
  const pointHovered = useRef<string | null>(null);
  const latest = useRef({ listHovered, enabledById, displayLabelsById, showInactive, nodeColors });
  const interactionRef = useRef<ReturnType<typeof bindSpatialInteraction> | null>(null);
  const scene = useRef<ReturnType<typeof createSpatialScene> | null>(null);
  const bindCamera = useWorkspaceCamera('atlas');
  useEffect(() => { latest.current = { listHovered, enabledById, displayLabelsById, showInactive, nodeColors }; });
  useEffect(() => {
    const container = containerRef.current;
    if (!enable3d || !container || !atlasDefinition) return;
    const view = createSpatialScene(container, atlasDefinition, spatialMode);
    scene.current = view;
    const unbindCamera = bindCamera.current(view.camera, view.controls);
    const byId = new Map(atlasDefinition.nodes.map(node => [node.id, node]));
    const interaction = bindSpatialInteraction({ container, canvas: view.renderer.domElement, camera: view.camera,
      nodes: view.nodes, links: view.linksGroup, atlasMeshes: view.atlasView.meshes,
      labels: () => latest.current.displayLabelsById, select: () => {},
      selectNode: id => {
        const enabled = latest.current.enabledById;
        const nodeVisibilityDraft = { ...enabled, [id]: enabled[id] === false };
        latest.current.enabledById = nodeVisibilityDraft;
        dispatch(setAtlasPanelState({ nodeVisibilityDraft }));
      },
      getHighlightColor: (_link, id) => (id ? latest.current.nodeColors[id] : undefined) ?? appColors.spatialNode,
      nodeTooltip: id => roiTooltip(byId.get(id), id),
      onHover: hover => {
        pointHovered.current = hover?.type === 'node' ? hover.nodeId : null;
        const data = latest.current;
        const hovered = pointHovered.current ?? data.listHovered;
        view.atlasView.update((hovered ? data.nodeColors[hovered] : undefined) ?? appColors.spatialNode,
          hovered, data.showInactive ? {} : data.enabledById);
      },
    });
    interactionRef.current = interaction;
    return () => { interactionRef.current = null; interaction.dispose(); unbindCamera(); view.dispose(); scene.current = null; pointHovered.current = null; };
  }, [atlasDefinition, bindCamera, containerRef, dispatch, enable3d, spatialMode]);
  useEffect(() => {
    const view = scene.current;
    if (!view) return;
    for (const mesh of view.pointMeshes) {
      const id = mesh.userData.nodeId as string;
      // Three.js scene objects are imperative, not React state.
      // eslint-disable-next-line react-hooks/immutability
      mesh.visible = enabledById[id] !== false || Boolean(showInactive);
      mesh.userData.displayVisible = mesh.visible;
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.opacity = enabledById[id] === false ? ATLAS_PANEL_INACTIVE_NODE_OPACITY : mesh.userData.baseOpacity;
      material.color.set(nodeColors[id] ?? appColors.spatialNode);
      mesh.userData.displayOpacity = material.opacity;
      mesh.userData.displayColor = material.color.clone();
      if (id === listHovered || id === pointHovered.current) {
        material.color.set(nodeColors[id] ?? appColors.spatialNode);
        material.opacity = 1;
      }
    }
    interactionRef.current?.refresh();
    const hovered = pointHovered.current ?? listHovered;
    view.atlasView.update((hovered ? nodeColors[hovered] : undefined) ?? appColors.spatialNode,
      hovered, showInactive ? {} : enabledById);
  }, [enabledById, nodeColors, showInactive, listHovered, atlasDefinition, spatialMode, enable3d]);
  return { applyCameraPose: (x: number, y: number, z: number) => scene.current?.pose(x, y, z) };
}
