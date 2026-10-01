#!/usr/bin/env python3

"""
Generate a closed volumetric Desikan-Killiany DK68 atlas for VAFCA.

Input
-----
FreeSurfer fsaverage/mri/aparc+aseg.mgz

Output
------
spatial/desikan68.glb
spatial/desikan68-report.json

Pipeline
--------
aparc+aseg.mgz
    -> binary mask for each cortical ROI
    -> marching cubes
    -> light Taubin smoothing
    -> 68 closed ROI meshes
    -> GLB

Each mesh is named using the VAFCA ROI identifier:

    lh-bankssts
    lh-caudalanteriorcingulate
    ...
    rh-bankssts
    ...

No command-line arguments are required.
"""

from pathlib import Path
import json

import nibabel as nib
import numpy as np
import trimesh

from skimage.measure import marching_cubes
from trimesh.exchange.gltf import export_glb

# =============================================================================
# CONFIGURATION
# =============================================================================

# Change this path to your local fsaverage directory.
FSAVERAGE = Path("/home/jorge/mne_data/MNE-fsaverage-data/fsaverage")

# Output files.
OUTPUT_DIR = Path("spatial")

GLB_OUTPUT = OUTPUT_DIR / "desikan68.glb"

REPORT_OUTPUT = OUTPUT_DIR / "desikan68-report.json"

# Number of Taubin smoothing iterations.
#
# 0  -> no smoothing
# 5  -> light smoothing
# 10 -> recommended starting point
# 15 -> stronger smoothing
SMOOTH_ITERATIONS = 10


# =============================================================================
# DESIKAN-KILLIANY LABELS
# =============================================================================
#
# FreeSurfer aparc+aseg convention:
#
#   1000-series = left cortical ROIs
#   2000-series = right cortical ROIs
#
# Example:
#
#   1001 = ctx-lh-bankssts
#   2001 = ctx-rh-bankssts
#
# Label 4 corresponds to corpus callosum and is intentionally omitted.
#
# This gives 34 cortical ROIs per hemisphere = 68 ROIs.
# =============================================================================

DESIKAN_LABELS = {
    "bankssts": 1,
    "caudalanteriorcingulate": 2,
    "caudalmiddlefrontal": 3,
    # 4 = corpuscallosum -> excluded
    "cuneus": 5,
    "entorhinal": 6,
    "fusiform": 7,
    "inferiorparietal": 8,
    "inferiortemporal": 9,
    "isthmuscingulate": 10,
    "lateraloccipital": 11,
    "lateralorbitofrontal": 12,
    "lingual": 13,
    "medialorbitofrontal": 14,
    "middletemporal": 15,
    "parahippocampal": 16,
    "paracentral": 17,
    "parsopercularis": 18,
    "parsorbitalis": 19,
    "parstriangularis": 20,
    "pericalcarine": 21,
    "postcentral": 22,
    "posteriorcingulate": 23,
    "precentral": 24,
    "precuneus": 25,
    "rostralanteriorcingulate": 26,
    "rostralmiddlefrontal": 27,
    "superiorfrontal": 28,
    "superiorparietal": 29,
    "superiortemporal": 30,
    "supramarginal": 31,
    "frontalpole": 32,
    "temporalpole": 33,
    "transversetemporal": 34,
    "insula": 35,
}


# =============================================================================
# HELPERS
# =============================================================================


def build_roi_labels():
    """
    Return:

        {
            "lh-bankssts": 1001,
            ...
            "rh-bankssts": 2001,
            ...
        }
    """

    roi_labels = {}

    for hemi, base in (
        ("lh", 1000),
        ("rh", 2000),
    ):
        for name, offset in DESIKAN_LABELS.items():

            roi_id = f"{hemi}-{name}"

            roi_labels[roi_id] = base + offset

    return roi_labels


def transform_vertices(
    vertices_voxel,
    affine,
):
    """
    Transform Nx3 voxel coordinates using a 4x4 affine matrix.
    """

    vertices_h = np.column_stack(
        [
            vertices_voxel,
            np.ones(len(vertices_voxel)),
        ]
    )

    transformed = (affine @ vertices_h.T).T

    return transformed[:, :3]


def build_roi_mesh(
    volume,
    label_value,
    vox2ras_tkr,
):
    """
    Extract a closed surface mesh for one ROI.
    """

    # -------------------------------------------------------------------------
    # Binary mask
    # -------------------------------------------------------------------------

    mask = volume == label_value

    voxel_count = int(mask.sum())

    if voxel_count == 0:
        return None

    # -------------------------------------------------------------------------
    # Add one background voxel around the mask.
    #
    # This ensures that marching cubes always sees a closed foreground
    # structure even if an ROI reaches the boundary of the image volume.
    # -------------------------------------------------------------------------

    pad = 1

    padded_mask = np.pad(
        mask.astype(np.uint8),
        pad_width=pad,
        mode="constant",
        constant_values=0,
    )

    # -------------------------------------------------------------------------
    # Marching cubes
    # -------------------------------------------------------------------------

    vertices_voxel, faces, _, _ = marching_cubes(
        padded_mask,
        level=0.5,
        step_size=1,
        allow_degenerate=False,
    )

    # Undo artificial padding.
    vertices_voxel -= pad

    # -------------------------------------------------------------------------
    # Convert voxel coordinates to FreeSurfer tkReg RAS.
    #
    # This is important because FreeSurfer cortical surfaces use this
    # coordinate convention.
    # -------------------------------------------------------------------------

    vertices_ras = transform_vertices(
        vertices_voxel,
        vox2ras_tkr,
    )

    # -------------------------------------------------------------------------
    # Create mesh
    # -------------------------------------------------------------------------

    mesh = trimesh.Trimesh(
        vertices=vertices_ras,
        faces=faces,
        process=True,
    )

    # Repair triangle orientation and normals.
    trimesh.repair.fix_winding(mesh)

    trimesh.repair.fix_normals(
        mesh,
        multibody=True,
    )

    # -------------------------------------------------------------------------
    # Smooth voxel stair-stepping.
    #
    # Taubin smoothing limits the shrinkage that would occur with standard
    # Laplacian smoothing.
    # -------------------------------------------------------------------------

    if SMOOTH_ITERATIONS > 0:

        trimesh.smoothing.filter_taubin(
            mesh,
            lamb=0.5,
            nu=0.53,
            iterations=SMOOTH_ITERATIONS,
        )

        trimesh.repair.fix_normals(
            mesh,
            multibody=True,
        )

    return mesh


def count_components(mesh):
    """
    Count disconnected components in a ROI mesh.
    """

    components = mesh.split(only_watertight=False)

    return len(components)


# =============================================================================
# MAIN
# =============================================================================


def main():

    print(
        "\n"
        "========================================\n"
        "Building VAFCA Desikan-Killiany DK68 GLB\n"
        "========================================\n"
    )

    # -------------------------------------------------------------------------
    # Locate input
    # -------------------------------------------------------------------------

    volume_path = FSAVERAGE / "mri" / "aparc+aseg.mgz"

    if not FSAVERAGE.exists():
        raise FileNotFoundError("fsaverage directory does not exist:\n" f"{FSAVERAGE}")

    if not volume_path.exists():
        raise FileNotFoundError("Could not find aparc+aseg.mgz:\n" f"{volume_path}")

    print(f"fsaverage:\n" f"{FSAVERAGE}\n")

    print(f"Input volume:\n" f"{volume_path}\n")

    # -------------------------------------------------------------------------
    # Load aparc+aseg
    # -------------------------------------------------------------------------

    img = nib.load(str(volume_path))

    volume = np.asarray(img.dataobj).astype(
        np.int32,
        copy=False,
    )

    print(f"Volume shape: {volume.shape}")

    # -------------------------------------------------------------------------
    # Get FreeSurfer tkReg RAS transform.
    #
    # Do not use img.affine here if the goal is alignment with FreeSurfer
    # surface coordinates.
    # -------------------------------------------------------------------------

    if not hasattr(
        img.header,
        "get_vox2ras_tkr",
    ):
        raise RuntimeError(
            "The image does not provide get_vox2ras_tkr(). "
            "Expected a FreeSurfer MGZ/MGH file."
        )

    vox2ras_tkr = img.header.get_vox2ras_tkr()

    print("\nVoxel -> tkReg RAS:")

    print(vox2ras_tkr)

    # -------------------------------------------------------------------------
    # Prepare output
    # -------------------------------------------------------------------------

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    roi_labels = build_roi_labels()

    if len(roi_labels) != 68:
        raise RuntimeError(
            "Expected 68 Desikan cortical labels, " f"found {len(roi_labels)}."
        )

    scene = trimesh.Scene()

    # -------------------------------------------------------------------------
    # Report
    # -------------------------------------------------------------------------

    report = {
        "source": str(volume_path),
        "coordinate_space": ("fsaverage-tkrRAS"),
        "smooth_iterations": (SMOOTH_ITERATIONS),
        "rois": {},
    }

    exported_count = 0
    watertight_count = 0

    # -------------------------------------------------------------------------
    # Build each ROI
    # -------------------------------------------------------------------------

    print("\n" "Generating ROIs\n" "---------------")

    for (
        roi_id,
        label_value,
    ) in roi_labels.items():

        voxel_count = int(np.count_nonzero(volume == label_value))

        if voxel_count == 0:

            print(f"WARNING: " f"{roi_id:<35} " f"label={label_value} " f"not found")

            report["rois"][roi_id] = {
                "label": (label_value),
                "voxel_count": 0,
                "exported": False,
            }

            continue

        mesh = build_roi_mesh(
            volume=volume,
            label_value=label_value,
            vox2ras_tkr=vox2ras_tkr,
        )

        if mesh is None:

            print(f"WARNING: could not " f"generate {roi_id}")

            continue

        # ---------------------------------------------------------------------
        # Diagnostics
        # ---------------------------------------------------------------------

        watertight = bool(mesh.is_watertight)

        components = count_components(mesh)

        volume_mm3 = None

        if watertight:

            watertight_count += 1

            volume_mm3 = float(abs(mesh.volume))

        # ---------------------------------------------------------------------
        # Add ROI to GLB scene.
        #
        # IMPORTANT:
        # The GLB object name exactly matches the VAFCA ROI id.
        # ---------------------------------------------------------------------

        scene.add_geometry(
            mesh,
            geom_name=roi_id,
            node_name=roi_id,
        )

        exported_count += 1

        status = "OK" if watertight else "NOT WATERTIGHT"

        print(
            f"{roi_id:<35} "
            f"label={label_value:<4} "
            f"voxels={voxel_count:<6} "
            f"vertices={len(mesh.vertices):<6} "
            f"faces={len(mesh.faces):<6} "
            f"components={components:<2} "
            f"{status}"
        )

        report["rois"][roi_id] = {
            "label": (label_value),
            "voxel_count": (voxel_count),
            "vertices": int(len(mesh.vertices)),
            "faces": int(len(mesh.faces)),
            "connected_components": (components),
            "watertight": (watertight),
            "volume_mm3": (volume_mm3),
            "exported": True,
        }

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------

    print("\n" "Summary\n" "-------")

    print("Expected ROIs:   68")

    print(f"Exported ROIs:   " f"{exported_count}")

    print(f"Watertight ROIs: " f"{watertight_count}")

    if exported_count != 68:

        print("\nWARNING: the generated atlas " "does not contain all 68 ROIs.")

    if watertight_count != exported_count:

        print("\nWARNING: one or more ROIs " "are not watertight.")

    # -------------------------------------------------------------------------
    # Write GLB
    # -------------------------------------------------------------------------

    GLB_OUTPUT.write_bytes(export_glb(scene))

    print(f"\nGLB written to:\n" f"{GLB_OUTPUT.resolve()}")

    # -------------------------------------------------------------------------
    # Write report
    # -------------------------------------------------------------------------

    report["expected_rois"] = 68

    report["exported_rois"] = exported_count

    report["watertight_rois"] = watertight_count

    REPORT_OUTPUT.write_text(
        json.dumps(
            report,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\nReport written to:\n" f"{REPORT_OUTPUT.resolve()}")

    print("\nDone.\n")


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    main()
