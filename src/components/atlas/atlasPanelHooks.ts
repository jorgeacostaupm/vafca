import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import type { AtlasDefinition } from "@/types/atlas";
import type { AtlasState } from "@/store/slices/atlasSlice";
import { UNKNOWN_GROUP, normalizeRoiFieldValue } from "@/utils/atlas/atlasDefinition";

export const ALL_FILTER = "__all__";

export type GroupedRow =
  | {
      type: "group";
      key: string;
      level: number;
      title: string;
      groupKey: string;
      count: number;
    }
  | { type: "roi"; key: string; id: string; level: number };

type SelectOption = { value: string; label: string };

const orderGroupValues = (values: string[]) => {
  return [...values].sort((a, b) => {
    const pa = a === UNKNOWN_GROUP ? 1 : 0;
    const pb = b === UNKNOWN_GROUP ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
};

const formatGroupValue = (value: string) =>
  value === UNKNOWN_GROUP ? "Unknown" : value;

const buildRoiColor = (index: number) => {
  const hue = (index * 0.61803398875) % 1;
  return new THREE.Color().setHSL(hue, 0.55, 0.55);
};

const buildRoiFieldValuesById = (
  atlasDefinition: AtlasDefinition | null,
  fields: string[],
) => {
  const map = new Map<string, Record<string, string>>();
  if (!atlasDefinition?.rois?.length || fields.length === 0) return map;

  atlasDefinition.rois.forEach((roi) => {
    const id = String(roi.id);
    const values = fields.reduce<Record<string, string>>((acc, field) => {
      acc[field] = normalizeRoiFieldValue(roi[field]);
      return acc;
    }, {});
    map.set(id, values);
  });
  return map;
};

const matchesQuery = (
  id: string,
  labelsById: AtlasState["labelsById"],
  normalizedQuery: string,
) => {
  if (!normalizedQuery) return true;
  const label = labelsById[id]?.label ?? id;
  return (
    id.toLowerCase().includes(normalizedQuery) ||
    label.toLowerCase().includes(normalizedQuery)
  );
};

const matchesFilters = (
  id: string,
  roiFieldValuesById: Map<string, Record<string, string>>,
  selectedFilters: Record<string, string>,
  ignoredField?: string,
) => {
  for (const [field, selected] of Object.entries(selectedFilters)) {
    if (field === ignoredField || selected === ALL_FILTER) continue;
    const value = roiFieldValuesById.get(id)?.[field] ?? UNKNOWN_GROUP;
    if (value !== selected) return false;
  }
  return true;
};

const filterIds = ({
  orderedIds,
  labelsById,
  roiFieldValuesById,
  normalizedQuery,
  selectedFilters,
}: {
  orderedIds: string[];
  labelsById: AtlasState["labelsById"];
  roiFieldValuesById: Map<string, Record<string, string>>;
  normalizedQuery: string;
  selectedFilters: Record<string, string>;
}) => {
  if (!normalizedQuery && Object.keys(selectedFilters).length === 0) {
    return orderedIds;
  }

  return orderedIds.filter((id) => {
    if (!matchesQuery(id, labelsById, normalizedQuery)) return false;
    return matchesFilters(id, roiFieldValuesById, selectedFilters);
  });
};

const buildFieldOptionsByField = ({
  groupByFields,
  orderedIds,
  labelsById,
  roiFieldValuesById,
  normalizedQuery,
  selectedFilters,
}: {
  groupByFields: string[];
  orderedIds: string[];
  labelsById: AtlasState["labelsById"];
  roiFieldValuesById: Map<string, Record<string, string>>;
  normalizedQuery: string;
  selectedFilters: Record<string, string>;
}) => {
  const entries = groupByFields.map((field) => {
    const values = new Set<string>();
    orderedIds.forEach((id) => {
      if (!matchesQuery(id, labelsById, normalizedQuery)) return;
      if (!matchesFilters(id, roiFieldValuesById, selectedFilters, field)) return;
      values.add(roiFieldValuesById.get(id)?.[field] ?? UNKNOWN_GROUP);
    });

    const options: SelectOption[] = [
      { value: ALL_FILTER, label: "All" },
      ...orderGroupValues(Array.from(values)).map((value) => ({
        value,
        label: formatGroupValue(value),
      })),
    ];
    return [field, options] as const;
  });

  return Object.fromEntries(entries) as Record<string, SelectOption[]>;
};

const buildGroupedRows = ({
  filteredIds,
  groupByFields,
  roiFieldValuesById,
  collapsedGroups,
}: {
  filteredIds: string[];
  groupByFields: string[];
  roiFieldValuesById: Map<string, Record<string, string>>;
  collapsedGroups: Set<string>;
}) => {
  if (filteredIds.length === 0) return [];
  if (groupByFields.length === 0) {
    return filteredIds.map((id) => ({
      type: "roi" as const,
      key: `roi-${id}`,
      id,
      level: 0,
    }));
  }

  const buildRows = (
    ids: string[],
    level: number,
    fieldIndex: number,
    pathParts: string[],
  ): GroupedRow[] => {
    if (fieldIndex >= groupByFields.length) {
      return ids.map((id) => ({
        type: "roi" as const,
        key: `roi-${id}`,
        id,
        level,
      }));
    }

    const field = groupByFields[fieldIndex];
    const groups = new Map<string, string[]>();
    ids.forEach((id) => {
      const value = roiFieldValuesById.get(id)?.[field] ?? UNKNOWN_GROUP;
      if (!groups.has(value)) {
        groups.set(value, []);
      }
      groups.get(value)?.push(id);
    });

    const rows: GroupedRow[] = [];
    const orderedValues = orderGroupValues(Array.from(groups.keys()));
    orderedValues.forEach((value) => {
      const groupIds = groups.get(value);
      if (!groupIds || groupIds.length === 0) return;
      const nextPath = [...pathParts, `${field}=${value}`];
      const groupKey = nextPath.join("|");
      rows.push({
        type: "group",
        key: `group|${groupKey}`,
        level,
        title: formatGroupValue(value),
        groupKey,
        count: groupIds.length,
      });
      if (collapsedGroups.has(groupKey)) return;
      rows.push(...buildRows(groupIds, level + 1, fieldIndex + 1, nextPath));
    });

    return rows;
  };

  return buildRows(filteredIds, 0, 0, []);
};

export const toggleSetValue = (values: Set<string>, value: string) => {
  const next = new Set(values);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
};

export const useAtlasPanelData = ({
  atlas,
  atlasDefinition,
  query,
  groupByFields,
  selectedFilters,
  collapsedGroups,
}: {
  atlas: AtlasState;
  atlasDefinition: AtlasDefinition | null;
  query: string;
  groupByFields: string[];
  selectedFilters: Record<string, string>;
  collapsedGroups: Set<string>;
}) => {
  const normalizedQuery = query.trim().toLowerCase();
  const roiFieldValuesById = useMemo(
    () => buildRoiFieldValuesById(atlasDefinition, groupByFields),
    [atlasDefinition, groupByFields],
  );

  const fieldOptionsByField = useMemo(
    () =>
      buildFieldOptionsByField({
        groupByFields,
        orderedIds: atlas.order,
        labelsById: atlas.labelsById,
        roiFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      groupByFields,
      atlas.order,
      atlas.labelsById,
      roiFieldValuesById,
      normalizedQuery,
      selectedFilters,
    ],
  );

  const filteredIds = useMemo(
    () =>
      filterIds({
        orderedIds: atlas.order,
        labelsById: atlas.labelsById,
        roiFieldValuesById,
        normalizedQuery,
        selectedFilters,
      }),
    [
      atlas.order,
      atlas.labelsById,
      roiFieldValuesById,
      normalizedQuery,
      selectedFilters,
    ],
  );

  const groupedRows = useMemo(
    () =>
      buildGroupedRows({
        filteredIds,
        groupByFields,
        roiFieldValuesById,
        collapsedGroups,
      }),
    [filteredIds, groupByFields, roiFieldValuesById, collapsedGroups],
  );

  const totalCount = atlas.order.length;
  const enabledCount = useMemo(
    () =>
      atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false)
        .length,
    [atlas.order, atlas.labelsById],
  );
  const allEnabled = totalCount > 0 && enabledCount === totalCount;
  const allDisabled = totalCount > 0 && enabledCount === 0;

  return {
    fieldOptionsByField,
    groupedRows,
    totalCount,
    enabledCount,
    allEnabled,
    allDisabled,
  };
};

export const useAtlasScene = ({
  atlasDefinition,
  atlas,
  containerRef,
  onToggle,
  enable3d,
}: {
  atlasDefinition: AtlasDefinition | null;
  atlas: AtlasState;
  containerRef: RefObject<HTMLDivElement | null>;
  onToggle: (id: string, enabled: boolean) => void;
  enable3d: boolean;
}) => {
  const atlasRef = useRef(atlas);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameRef = useRef<number | null>(null);
  const roiObjectsRef = useRef<Map<string, THREE.Mesh>>(new Map());

  useEffect(() => {
    atlasRef.current = atlas;
  }, [atlas]);

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
    if (!enable3d || !container || !atlasDefinition?.rois?.length) {
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

    const roiObjects = new Map<string, THREE.Mesh>();
    const currentLabels = atlasRef.current.labelsById;
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
        opacity: 0.7,
        roughness: 0.5,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = {
        roiId: String(roi.id),
        baseColor: baseColor.clone(),
        baseOpacity: material.opacity,
      };
      mesh.visible = currentLabels[String(roi.id)]?.enabled !== false;
      roiObjects.set(String(roi.id), mesh);
      group.add(mesh);
    });

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    roiObjectsRef.current = roiObjects;

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

    const objects = Array.from(roiObjects.values());
    const isRoiEnabled = (roiId?: string) =>
      roiId ? atlasRef.current.labelsById[roiId]?.enabled !== false : false;
    const pickEnabledHit = (hits: THREE.Intersection[]) => {
      for (const hit of hits) {
        const roiId = hit.object.userData?.roiId as string | undefined;
        if (isRoiEnabled(roiId)) {
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
      const roiId = hit.userData?.roiId as string | undefined;
      if (!roiId) return;
      const current = atlasRef.current.labelsById[roiId];
      const enabled = current?.enabled !== false;
      if (enabled) {
        hit.visible = false;
        onToggle(roiId, false);
        hideTooltip();
      }
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
      const roiId = hit.userData?.roiId as string | undefined;
      if (!roiId) {
        hideTooltip();
        return;
      }
      const labelMeta = atlasRef.current.labelsById[roiId];
      const label = labelMeta?.label ?? roiId;
      const acronym = labelMeta?.acronym;
      const tooltipText =
        acronym && acronym !== label ? `${label} (${acronym})` : label;
      if (hoveredId !== roiId || tooltip.textContent !== tooltipText) {
        tooltip.textContent = tooltipText;
        hoveredId = roiId;
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
      for (const mesh of roiObjects.values()) {
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
      roiObjectsRef.current = new Map();
    };
  }, [atlasDefinition, containerRef, onToggle, enable3d]);

  useEffect(() => {
    const roiObjects = roiObjectsRef.current;
    if (roiObjects.size === 0) return;
    for (const [id, mesh] of roiObjects) {
      mesh.visible = atlas.labelsById[id]?.enabled !== false;
    }
  }, [atlas.labelsById]);

  return { applyCameraPose };
};
