import { type RefObject, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";

import { useAppDispatch } from "@/store/hooks";
import { setLabelEnabled } from "@/store/slices/atlasUi";
import type { AtlasDefinition } from "@/types/atlas";

const buildNodeColor = (index: number) => {
  const hue = (index * 0.61803398875) % 1;
  return new THREE.Color().setHSL(hue, 0.55, 0.55);
};

type UseAtlasSceneArgs = {
  atlasDefinition: AtlasDefinition | null;
  enabledById: Record<string, boolean>;
  displayLabelsById: Record<string, string>;
  containerRef: RefObject<HTMLDivElement | null>;
  enable3d: boolean;
};

export const useAtlasScene = ({
  atlasDefinition,
  enabledById,
  displayLabelsById,
  containerRef,
  enable3d,
}: UseAtlasSceneArgs) => {
  const dispatch = useAppDispatch();
  const enabledByIdRef = useRef(enabledById);
  const displayLabelsByIdRef = useRef(displayLabelsById);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number | null>(null);
  const nodeObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  useEffect(() => {
    enabledByIdRef.current = enabledById;
  }, [enabledById]);

  useEffect(() => {
    displayLabelsByIdRef.current = displayLabelsById;
  }, [displayLabelsById]);

  const applyCameraPose = useCallback((x: number, y: number, z: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    camera.position.set(x, y, z);
    camera.up.set(0, 0, 1);
    controls.target.set(0, 0, 0);
    controls.update();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!enable3d || !container || !atlasDefinition?.nodes?.length) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0f16");

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.01,
      100,
    );
    camera.position.set(0, 1, 0);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.15;
    controls.maxDistance = 1.2;
    controls.target.set(0, 0, 0);
    controls.update();

    const group = new THREE.Group();
    scene.add(group);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(0.6, 0.8, 0.5);
    const fillLight = new THREE.DirectionalLight(0x9bb4ff, 0.35);
    fillLight.position.set(-0.6, -0.2, 0.4);
    scene.add(ambient, keyLight, fillLight);

    const nodeObjects = new Map<string, THREE.Mesh>();
    const currentEnabledById = enabledByIdRef.current;
    atlasDefinition.nodes.forEach((node, index) => {
      const rawPoints = Array.isArray(node.mesh_points) ? node.mesh_points : [];
      const points = rawPoints
        .filter(
          (point): point is number[] =>
            Array.isArray(point) &&
            point.length === 3 &&
            point.every((value) => typeof value === "number" && Number.isFinite(value)),
        )
        .map((p) => new THREE.Vector3(p[0], p[1], p[2]));

      if (points.length < 4) return;

      const geometry = new ConvexGeometry(points);
      geometry.computeVertexNormals();
      const baseColor = buildNodeColor(index);
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.7,
        roughness: 0.5,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const internalId = String(node.id);
      const atlasId = String(node.atlasId);
      const sceneNodeId = internalId in currentEnabledById ? internalId : atlasId;
      mesh.userData = {
        nodeId: sceneNodeId,
        baseColor: baseColor.clone(),
        baseOpacity: material.opacity,
      };
      mesh.visible = currentEnabledById[sceneNodeId] !== false;
      nodeObjects.set(sceneNodeId, mesh);
      group.add(mesh);
    });

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    nodeObjectsRef.current = nodeObjects;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tooltip = document.createElement("div");
    tooltip.className = "atlas-tooltip";
    tooltip.style.opacity = "0";
    container.appendChild(tooltip);
    let hoveredId: string | null = null;
    const TOOLTIP_OFFSET = 12;

    const hideTooltip = () => {
      if (hoveredId !== null) hoveredId = null;
      tooltip.style.opacity = "0";
      renderer.domElement.style.cursor = "default";
    };

    const positionTooltip = (x: number, y: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const tooltipWidth = tooltip.offsetWidth;
      const tooltipHeight = tooltip.offsetHeight;
      const maxLeft = rect.width - tooltipWidth - TOOLTIP_OFFSET;
      const maxTop = rect.height - tooltipHeight - TOOLTIP_OFFSET;

      const left = Math.min(
        Math.max(x + TOOLTIP_OFFSET, TOOLTIP_OFFSET),
        Math.max(TOOLTIP_OFFSET, maxLeft),
      );
      const top = Math.min(
        Math.max(y + TOOLTIP_OFFSET, TOOLTIP_OFFSET),
        Math.max(TOOLTIP_OFFSET, maxTop),
      );

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };

    const objects = Array.from(nodeObjects.values());
    const isNodeEnabled = (nodeId?: string) =>
      nodeId ? enabledByIdRef.current[nodeId] !== false : false;

    const pickEnabledHit = (hits: THREE.Intersection[]) => {
      for (const hit of hits) {
        const nodeId = hit.object.userData?.nodeId as string | undefined;
        if (isNodeEnabled(nodeId)) {
          return hit;
        }
      }
      return undefined;
    };

    const handleDoubleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(objects, false);
      const hit = pickEnabledHit(hits)?.object as THREE.Mesh | undefined;
      if (!hit) return;

      const nodeId = hit.userData?.nodeId as string | undefined;
      if (!nodeId) return;

      const enabled = enabledByIdRef.current[nodeId] !== false;
      if (!enabled) return;

      hit.visible = false;
      dispatch(setLabelEnabled({ id: nodeId, enabled: false }));
      hideTooltip();
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(objects, false);
      const hit = pickEnabledHit(hits)?.object as THREE.Mesh | undefined;
      if (!hit) {
        hideTooltip();
        return;
      }

      const nodeId = hit.userData?.nodeId as string | undefined;
      if (!nodeId) {
        hideTooltip();
        return;
      }

      const tooltipText = displayLabelsByIdRef.current[nodeId] ?? nodeId;

      if (hoveredId !== nodeId || tooltip.textContent !== tooltipText) {
        tooltip.textContent = tooltipText;
        hoveredId = nodeId;
      }

      tooltip.style.opacity = "1";
      renderer.domElement.style.cursor = "pointer";
      positionTooltip(event.clientX - rect.left, event.clientY - rect.top);
    };

    const handlePointerLeave = () => {
      hideTooltip();
    };

    renderer.domElement.addEventListener("dblclick", handleDoubleClick);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height } = entry.contentRect;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("dblclick", handleDoubleClick);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);

      if (tooltip.parentElement === container) {
        container.removeChild(tooltip);
      }
      if (frameRef.current) cancelAnimationFrame(frameRef.current);

      controls.dispose();
      renderer.dispose();
      for (const mesh of nodeObjects.values()) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          for (const material of mesh.material) {
            material.dispose();
          }
        } else {
          mesh.material.dispose();
        }
      }
      group.clear();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      nodeObjectsRef.current = new Map();
    };
  }, [atlasDefinition, containerRef, dispatch, enable3d]);

  useEffect(() => {
    const nodeObjects = nodeObjectsRef.current;
    if (nodeObjects.size === 0) return;

    for (const [id, mesh] of nodeObjects) {
      // THREE meshes are imperative scene objects, not React state.
      // eslint-disable-next-line react-hooks/immutability
      mesh.visible = enabledById[id] !== false;
    }
  }, [enabledById]);

  return { applyCameraPose };
};
