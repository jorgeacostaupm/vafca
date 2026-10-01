from pathlib import Path
import json

import numpy as np
import trimesh
from nibabel.freesurfer.io import read_geometry, read_annot
from trimesh.exchange.gltf import export_glb

# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

FSAVERAGE = Path("/home/jorge/mne_data/MNE-fsaverage-data/fsaverage")

OUTPUT_DIR = Path("spatial")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

GLB_OUTPUT = OUTPUT_DIR / "desikan68.glb"
CENTROIDS_OUTPUT = OUTPUT_DIR / "desikan68-centroids.json"


# Labels that are not part of the 68 cortical DK ROIs
SKIP_LABELS = {
    "unknown",
    "corpuscallosum",
}


# ---------------------------------------------------------------------
# Create scene
# ---------------------------------------------------------------------

scene = trimesh.Scene()
centroids = {}

exported_rois = []

for hemi in ("lh", "rh"):

    surface_path = FSAVERAGE / "surf" / f"{hemi}.pial"
    annot_path = FSAVERAGE / "label" / f"{hemi}.aparc.annot"

    vertices, faces = read_geometry(surface_path)

    # orig_ids=False means labels are indices into `names`
    labels, _, names = read_annot(annot_path, orig_ids=False)

    names = [name.decode("utf-8") for name in names]

    for label_index, label_name in enumerate(names):

        if label_name.lower() in SKIP_LABELS:
            continue

        roi_id = f"{hemi}-{label_name}"

        # Keep triangles whose three vertices belong to this ROI
        face_labels = labels[faces]

        mask = np.all(face_labels == label_index, axis=1)

        roi_faces = faces[mask]

        if len(roi_faces) == 0:
            continue

        # Build ROI mesh
        mesh = trimesh.Trimesh(
            vertices=vertices.copy(), faces=roi_faces.copy(), process=False
        )

        mesh.remove_unreferenced_vertices()

        # Give every ROI its own stable name
        scene.add_geometry(mesh, geom_name=roi_id, node_name=roi_id)

        # Compute an anchor point for links/nodes
        roi_vertex_indices = np.where(labels == label_index)[0]

        centroid = vertices[roi_vertex_indices].mean(axis=0)

        centroids[roi_id] = {
            "x": float(centroid[0]),
            "y": float(centroid[1]),
            "z": float(centroid[2]),
            "space": "fsaverage",
        }

        exported_rois.append(roi_id)


# ---------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------

print(f"Exported ROIs: {len(exported_rois)}")

if len(exported_rois) != 68:
    print("WARNING: expected 68 Desikan-Killiany cortical ROIs")

for roi_id in sorted(exported_rois):
    print(roi_id)


# ---------------------------------------------------------------------
# Export GLB
# ---------------------------------------------------------------------

GLB_OUTPUT.write_bytes(export_glb(scene))

CENTROIDS_OUTPUT.write_text(json.dumps(centroids, indent=2))

print(f"\nGLB written to: {GLB_OUTPUT}")
print(f"Centroids written to: {CENTROIDS_OUTPUT}")
