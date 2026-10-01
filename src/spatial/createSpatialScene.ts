import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'

import { SPATIAL_SCENE } from '@/config/ui'
import { appColors } from '@/theme'
import type { AtlasDefinition } from '@/types/atlas'
import { createSpatialGeometryBuilder, getSpatialNodeCenter, orientSpatialGroup } from '@/utils/atlas/spatialGeometry'

import { createAtlasView } from './atlasView'

export function createSpatialScene(
  container: HTMLDivElement,
  atlas: AtlasDefinition,
  mode: 'none' | 'points' | 'geometry',
) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(appColors.surface)
  const camera = new THREE.PerspectiveCamera(
    SPATIAL_SCENE.fov,
    container.clientWidth / Math.max(container.clientHeight, 1),
    SPATIAL_SCENE.near,
    SPATIAL_SCENE.far,
  )
  camera.position.set(0, SPATIAL_SCENE.cameraDistance, 0)
  camera.up.set(0, 0, 1)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.shadowMap.enabled = false
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.setSize(container.clientWidth, container.clientHeight)
  container.appendChild(renderer.domElement)
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = SPATIAL_SCENE.damping
  controls.minDistance = SPATIAL_SCENE.minDistance
  controls.maxDistance = SPATIAL_SCENE.maxDistance
  const spatialGroup = new THREE.Group()
  const nodesGroup = new THREE.Group()
  const linksGroup = new THREE.Group()
  spatialGroup.add(nodesGroup, linksGroup)
  scene.add(spatialGroup)
  orientSpatialGroup(spatialGroup, atlas.nodes, atlas.spatial)
  const atlasView = createAtlasView(spatialGroup, mode !== 'none' ? atlas.spatial : undefined)
  const nodes = new Map<string, THREE.Mesh>()
  const pointMeshes = new Set<THREE.Mesh>()
  const centers = new Map<string, THREE.Vector3>()
  const build = createSpatialGeometryBuilder(atlas.nodes, mode, atlas.spatial)
  for (const node of atlas.nodes) {
    const rawCenter = getSpatialNodeCenter(node, atlas.spatial)
    const ids = new Set([node.id])
    if (node.atlasId !== undefined && node.atlasId !== null) ids.add(String(node.atlasId))
    if (rawCenter) for (const id of ids) centers.set(id, new THREE.Vector3(...rawCenter))
    if (mode === 'none') continue
    const spatial = build(node)
    if (!spatial) continue
    const material = new THREE.MeshStandardMaterial({
      color: appColors.spatialNode,
      transparent: true,
      opacity: SPATIAL_SCENE.pointOpacity,
      roughness: 0.9, metalness: 0,
    })
    const mesh = new THREE.Mesh(spatial.geometry, material)
    mesh.userData = { nodeId: node.id, vafcaRoiId: node.id, baseOpacity: material.opacity }
    mesh.castShadow = false
    mesh.receiveShadow = false
    nodesGroup.add(mesh)
    pointMeshes.add(mesh)
    for (const id of ids) nodes.set(id, mesh)
  }
  const isGeometry = atlasView.meshes.length > 0
  scene.add(new THREE.AmbientLight(appColors.spatialLight, SPATIAL_SCENE.ambientIntensity
    * (isGeometry ? SPATIAL_SCENE.geometryAmbientMultiplier : 1)))
  const light = new THREE.DirectionalLight(appColors.spatialLight, SPATIAL_SCENE.directionalIntensity
    * (isGeometry ? SPATIAL_SCENE.geometryDirectionalMultiplier : 1))
  light.position.set(...SPATIAL_SCENE.lightPosition)
  light.castShadow = false
  scene.add(light)
  let frame = 0
  const animate = () => {
    frame = requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
  }
  animate()
  const resize = new ResizeObserver(() => {
    const { clientWidth: width, clientHeight: height } = container
    camera.aspect = width / Math.max(height, 1)
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    for (const line of linksGroup.children)
      if (line instanceof Line2) line.material.resolution.set(width, height)
  })
  resize.observe(container)
  return {
    camera,
    renderer,
    controls,
    nodes,
    centers,
    pointMeshes,
    linksGroup,
    atlasView,
    pose(x: number, y: number, z: number) {
      camera.position.set(x, y, z)
      camera.up.set(0, 0, 1)
      controls.target.set(0, 0, 0)
      controls.update()
    },
    dispose() {
      cancelAnimationFrame(frame)
      resize.disconnect()
      controls.dispose()
      atlasView.dispose()
      for (const mesh of pointMeshes) {
        mesh.geometry.dispose()
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) material.dispose()
      }
      for (const line of linksGroup.children)
        if (line instanceof Line2) {
          line.geometry.dispose()
          line.material.dispose()
        }
      spatialGroup.clear()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
