import { useEffect, useMemo, useRef } from "react";
import { Button, Space, Typography } from "antd";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { useAppSelector } from "@/store/hooks";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { atlasSupports3d } from "@/utils/atlas/atlasDefinition";

const buildRoiColor = (index: number) => {
  const hue = (index * 0.61803398875) % 1;
  return new THREE.Color().setHSL(hue, 0.55, 0.55);
};

const buildHighlightColor = (base: THREE.Color) =>
  base.clone().lerp(new THREE.Color("#ffffff"), 0.28);

export default function SelectedLinksAtlas() {
  const dataset = useAppSelector((state) => state.dataset.data);
  const selectedLinks = useAppSelector((state) => state.visualizationUi.selectedLinks);
  const atlasLinkIds = useAppSelector((state) => state.visualizationUi.atlasLinkIds);
  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number | null>(null);
  const roiObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const roiCentersRef = useRef<Map<string, THREE.Vector3>>(new Map());
  const linkGroupRef = useRef<THREE.Group | null>(null);
  const linkMaterialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeLinks = useMemo(() => {
    if (atlasLinkIds.length === 0) return [];
    const activeSet = new Set(atlasLinkIds);
    return selectedLinks.filter((link) => activeSet.has(link.id));
  }, [atlasLinkIds, selectedLinks]);

  const highlightedRoiIds = useMemo(() => {
    const set = new Set<string>();
    activeLinks.forEach((link) => {
      set.add(link.rowId);
      set.add(link.colId);
    });
    return set;
  }, [activeLinks]);

  const hasLinkFocus = highlightedRoiIds.size > 0;
  const has3d = atlasSupports3d(atlasDefinition);
  const statusLabel = hasLinkFocus
    ? `Showing ${activeLinks.length} link${activeLinks.length === 1 ? "" : "s"} · ${highlightedRoiIds.size} ROI${highlightedRoiIds.size === 1 ? "" : "s"}`
    : "Select links to highlight them in the atlas";

  const applyCameraPose = (x: number, y: number, z: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(x, y, z);
    camera.up.set(0, 0, 1);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!has3d || !container || !atlasDefinition?.rois?.length) return undefined;

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
    const linkGroup = new THREE.Group();
    scene.add(linkGroup);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(0.6, 0.8, 0.5);
    const fillLight = new THREE.DirectionalLight(0x9bb4ff, 0.35);
    fillLight.position.set(-0.6, -0.2, 0.4);
    scene.add(ambient, keyLight, fillLight);

    const roiObjects = new Map<string, THREE.Mesh>();
    const roiCenters = new Map<string, THREE.Vector3>();
    atlasDefinition.rois.forEach((roi, index) => {
      const rawPoints = Array.isArray(roi.mesh_points) ? roi.mesh_points : [];
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
      const baseColor = buildRoiColor(index);
      const material = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 0.65,
        roughness: 0.5,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const highlightColor = buildHighlightColor(baseColor);
      const center = points.reduce(
        (acc, point) => acc.add(point),
        new THREE.Vector3(),
      );
      center.divideScalar(points.length);
      const roiIds = [String(roi.id), String(roi.atlasId)];
      mesh.userData = {
        roiId: String(roi.id),
        baseColor: baseColor.clone(),
        highlightColor: highlightColor.clone(),
        baseOpacity: material.opacity,
      };
      roiIds.forEach((id) => {
        roiObjects.set(id, mesh);
        roiCenters.set(id, center);
      });
      group.add(mesh);
    });

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    roiObjectsRef.current = roiObjects;
    roiCentersRef.current = roiCenters;
    linkGroupRef.current = linkGroup;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

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
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      controls.dispose();
      renderer.dispose();
      for (const mesh of new Set(roiObjects.values())) {
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
      linkGroup.clear();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      roiObjectsRef.current = new Map();
      roiCentersRef.current = new Map();
      linkGroupRef.current = null;
      if (linkMaterialRef.current) {
        linkMaterialRef.current.dispose();
        linkMaterialRef.current = null;
      }
    };
  }, [atlasDefinition, has3d]);

  useEffect(() => {
    const roiObjects = roiObjectsRef.current;
    if (roiObjects.size === 0) return;
    for (const [id, mesh] of roiObjects) {
      // THREE meshes are imperative scene objects, not React state.
      // eslint-disable-next-line react-hooks/immutability
      mesh.visible = true;
      const material = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (!material) continue;
      const baseColor = mesh.userData?.baseColor as THREE.Color | undefined;
      const highlightColor = mesh.userData?.highlightColor as
        | THREE.Color
        | undefined;
      const baseOpacity =
        (mesh.userData?.baseOpacity as number | undefined) ?? 0.65;
      if (hasLinkFocus) {
        if (highlightedRoiIds.has(id)) {
          if (highlightColor) material.color.copy(highlightColor);
          if (baseColor) material.emissive.copy(baseColor);
          material.emissiveIntensity = 0.35;
          material.opacity = Math.min(1, baseOpacity + 0.25);
        } else {
          if (baseColor) material.color.copy(baseColor);
          material.emissive.setRGB(0, 0, 0);
          material.emissiveIntensity = 0;
          material.opacity = 0.08;
        }
      } else {
        if (baseColor) material.color.copy(baseColor);
        material.emissive.setRGB(0, 0, 0);
        material.emissiveIntensity = 0;
        material.opacity = baseOpacity;
      }
      material.needsUpdate = true;
    }
  }, [hasLinkFocus, highlightedRoiIds]);

  useEffect(() => {
    const linkGroup = linkGroupRef.current;
    if (!linkGroup) return;
    for (const child of linkGroup.children) {
      if (child instanceof THREE.Line) {
        child.geometry.dispose();
      }
    }
    linkGroup.clear();
    if (!hasLinkFocus) return;
    const roiCenters = roiCentersRef.current;
    if (!linkMaterialRef.current) {
      linkMaterialRef.current = new THREE.LineBasicMaterial({
        color: 0x8fc5ff,
        transparent: true,
        opacity: 0.75,
        depthTest: false,
      });
    }
    const material = linkMaterialRef.current;
    activeLinks.forEach((link) => {
      const start = roiCenters.get(link.rowId);
      const end = roiCenters.get(link.colId);
      if (!start || !end) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const line = new THREE.Line(geometry, material);
      line.renderOrder = 2;
      linkGroup.add(line);
    });
  }, [activeLinks, hasLinkFocus]);

  if (!atlasDefinition?.rois?.length) {
    return (
      <div className="links-atlas links-atlas--empty">
        <Typography.Text type="secondary">
          Atlas not available for this dataset.
        </Typography.Text>
      </div>
    );
  }

  if (!has3d) {
    return (
      <div className="links-atlas links-atlas--empty">
        <Typography.Text type="secondary">
          This atlas does not include mesh points. 3D view is disabled.
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className="links-atlas">
      <div className="links-atlas__header">
        <Space size={8}>
          <Button size="small" onClick={() => applyCameraPose(0, 1, 0)}>
            Front
          </Button>
          <Button size="small" onClick={() => applyCameraPose(1, 0, 0)}>
            Right
          </Button>
          <Button size="small" onClick={() => applyCameraPose(0, 0, 1)}>
            Top
          </Button>
          <Button size="small" onClick={() => applyCameraPose(-1, 0, 0)}>
            Left
          </Button>
        </Space>
        <Typography.Text type="secondary">{statusLabel}</Typography.Text>
      </div>
      <div className="links-atlas__canvas" ref={containerRef} />
    </div>
  );
}
