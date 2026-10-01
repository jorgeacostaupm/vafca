import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

import { SPATIAL_EDGE_WIDTH, SPATIAL_EMPHASIS_WIDTH } from '@/config/ui';
import type { SelectedLink, SpatialVisualStyle } from '@/types/visualizationUi';
import { findSelectedLinkId } from '@/utils/selectedLinkKeys';

export function populateSpatialLinks(linkGroup: THREE.Group, nodeCenters: Map<string, THREE.Vector3>,
  activeLinks: SelectedLink[], visualStyle: SpatialVisualStyle, selected: Record<string, SelectedLink>,
  selectionColor: string, _diverging: boolean, resolution: THREE.Vector2, annotationColors?: Record<string, string>) {
    const existing = new Map(linkGroup.children.filter((object): object is Line2 => object instanceof Line2)
      .map(line => [(line.userData.link as SelectedLink).id, line]));
    activeLinks.forEach((link) => {
      const start = nodeCenters.get(link.rowId);
      const end = nodeCenters.get(link.colId);
      if (!start || !end) return;
      const value = link.sources[0]?.value ?? 0;
      const annotatedColor = annotationColors?.[`${link.rowId}::${link.colId}`];
      const isSelected = annotationColors ? Boolean(annotatedColor) : findSelectedLinkId(selected, link.rowId, link.colId) !== undefined;
      const color = isSelected ? annotatedColor ?? selectionColor
        : value === 0 ? visualStyle.neutralLinkColor
        : value < 0 ? visualStyle.negativeLinkColor : visualStyle.positiveLinkColor;
      const width = SPATIAL_EDGE_WIDTH * (isSelected ? SPATIAL_EMPHASIS_WIDTH : 1);
      let line = existing.get(link.id);
      existing.delete(link.id);
      if (!line) {
        const material = new LineMaterial({ linewidth: width, alphaToCoverage: true, depthWrite: false, depthTest: false });
        const geometry = new LineGeometry().setPositions([...start.toArray(), ...end.toArray()]);
        line = new Line2(geometry, material);
        line.renderOrder = 2;
        linkGroup.add(line);
      }
      line.material.color.set(color);
      line.material.linewidth = width;
      line.material.resolution.copy(resolution);
      line.userData = { link, width, displayColor: line.material.color.clone() };
    });
    for (const line of existing.values()) {
      line.geometry.dispose();
      line.material.dispose();
      linkGroup.remove(line);
    }
}
