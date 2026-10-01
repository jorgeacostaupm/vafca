import { type RefObject, useEffect, useRef } from 'react';
import * as THREE from 'three';

import { bindSpatialInteraction } from '@/components/selected-links/spatialInteraction';
import { ATLAS_PANEL_INACTIVE_NODE_OPACITY } from '@/config/ui';
import { useAtlasLabelPresentation } from '@/hooks/useAtlasLabelPresentation';
import { createSpatialScene } from '@/spatial/createSpatialScene';
import { roiTooltip } from '@/spatial/roiTooltip';
import { useSpatialSelection } from '@/spatial/useSpatialSelection';
import { useAppSelector } from '@/store/hooks';
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
  const selection = useSpatialSelection();
  const spatialMode = useAppSelector(state => state.visualizationUi.atlasPanel.spatialMode === 'points' ? 'points' : 'geometry');
  const showInactive = useAppSelector(state => state.visualizationUi.atlasPanel.showInactiveNodes);
  const { nodeColors } = useAtlasLabelPresentation();
  const listHovered = useAppSelector(state => state.visualizationUi.atlasPanel.hoveredNodeId ?? null);
  const pointHovered = useRef<string | null>(null);
  const latest = useRef({ listHovered, enabledById, displayLabelsById, showInactive, selection });
  const scene = useRef<ReturnType<typeof createSpatialScene> | null>(null);
  const bindCamera = useWorkspaceCamera('atlas');
  useEffect(() => { latest.current = { listHovered, enabledById, displayLabelsById, showInactive, selection }; });
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
      selectNode: id => latest.current.selection.selectNode(id),
      getHighlightColor: (_link, id) => (id ? latest.current.selection.colors.nodes[id] : undefined) ?? latest.current.selection.color,
      nodeTooltip: id => roiTooltip(byId.get(id), id),
      onHover: hover => {
        pointHovered.current = hover?.type === 'node' ? hover.nodeId : null;
        const data = latest.current;
        view.atlasView.update(data.selection.color, pointHovered.current ?? data.listHovered,
          data.showInactive ? {} : data.enabledById, undefined, data.selection.colors.nodes);
      },
    });
    return () => { interaction.dispose(); unbindCamera(); view.dispose(); scene.current = null; pointHovered.current = null; };
  }, [atlasDefinition, bindCamera, containerRef, enable3d, spatialMode]);
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
      material.color.set(selection.colors.nodes[id] ?? nodeColors[id] ?? appColors.spatialNode);
      mesh.userData.displayOpacity = material.opacity;
      mesh.userData.displayColor = material.color.clone();
      if (id === listHovered) material.color.set(selection.colors.nodes[id] ?? selection.color);
    }
    view.atlasView.update(selection.color, pointHovered.current ?? listHovered,
      showInactive ? {} : enabledById, undefined, selection.colors.nodes);
  }, [selection, enabledById, nodeColors, showInactive, listHovered, atlasDefinition, spatialMode, enable3d]);
  return { applyCameraPose: (x: number, y: number, z: number) => scene.current?.pose(x, y, z) };
}
