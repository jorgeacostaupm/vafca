# How to prepare data for VAFCA

VAFCA imports connectivity data from **one ZIP file**. The ZIP contains JSON files describing your networks in matrix format, their categories, and the regions of interest (ROIs). Every import uses the same strict validation; there is no permissive import mode.

This guide starts with a small dataset and then explains each part of the format.

## Quick start

Create a folder with this structure:

```text
my-dataset/
├── matrices.json
├── rois.json
├── spatial/                   # optional
│   ├── manifest.json
│   └── atlas.glb
└── catalogs/
    ├── dimensions.json
    ├── sources.json
    ├── measures.json
    ├── statistics.json
    └── condition.json
```

`matrices.json` may be replaced by a `matrices/` folder containing one JSON file per matrix. This is the only alternative file arrangement supported.

Zip the **contents** of `my-dataset`, not the folder itself. Files such as `matrices.json`, `rois.json`, and the `catalogs` folder must be at the top level of the ZIP. Do not add `manifest.json`; it is not part of the input format.

Then open the data-management window in VAFCA and drag the ZIP file into the upload area.

> VAFCA currently supports undirected networks only. Full matrices must therefore be symmetric.

## A small working example

### `matrices.json`

This file contains one or more connectivity matrices. The following example defines a three-ROI network:

```json
[
  {
    "id": "dataset-baseline-connectivity-value",
    "label": "Example connectivity",
    "source": "dataset",
    "measure": "connectivity",
    "statistic": "value",
    "dimensions": {
      "condition": "baseline"
    },
    "layout": "full",
    "data": [
      [0, 0.32, 0.18],
      [0.32, 0, 0.44],
      [0.18, 0.44, 0]
    ]
  }
]
```

Each matrix needs these fields:

| Field        | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `id`         | A unique text identifier for the network.                               |
| `source`     | Who or what the data represents, such as `control` or `patient-01`.     |
| `measure`    | The connectivity measure, such as `plv` or `correlation`.               |
| `statistic`  | The value type, such as `value`, `mean`, `std`, or `zscore`.            |
| `dimensions` | A value for every custom aspect declared in `catalogs/dimensions.json`. |
| `data`       | The matrix values. Values must be finite numbers or `null`.             |

`label` is optional and provides a friendly display name. `layout` is also optional and defaults to `full`.

### `catalogs/dimensions.json`

This file declares the custom dimensions used to classify matrices. This example declares the general dimension `condition`:

```json
{
  "core": {
    "source": { "label": "Source" },
    "measure": { "label": "Measure" },
    "statistic": { "label": "Statistic" }
  },
  "aspects": [{ "id": "condition", "label": "Condition" }]
}
```

The `aspects` array is the list of custom dimension definitions. Its `id` connects three parts of the format:

| Definition                   | Matrix value                        | Value catalog                                           |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------- |
| `aspects[].id = "condition"` | `dimensions.condition = "baseline"` | `catalogs/condition.json` contains the `baseline` entry |

Every declared dimension requires a unique `id`, and every matrix must provide one value for each declaration. The value-catalog filename must equal that `id`. The catalog then describes the possible values; custom dimensions are not limited to conditions or frequency bands.

### Catalog files

Catalogs turn IDs into readable labels and provide optional display settings. `catalogs/dimensions.json` is required. The remaining catalog files are optional, but are strongly recommended for user-friendly labels and predictable visualization settings.

`catalogs/sources.json`

```json
{
  "dataset": {
    "label": "Dataset",
    "kind": "population"
  }
}
```

`catalogs/measures.json`

```json
{
  "connectivity": {
    "label": "Connectivity",
    "expectedRange": [0, 1]
  }
}
```

`catalogs/statistics.json`

```json
{
  "value": {
    "label": "Value",
    "scaleType": "sequential",
    "rangeMode": "inherit_measure"
  }
}
```

`catalogs/condition.json`

```json
{
  "baseline": {
    "label": "Baseline"
  }
}
```

Catalog keys must match the corresponding values used by the matrices. For example:

- `"source": "dataset"` refers to the `dataset` entry in `sources.json`.
- `"measure": "connectivity"` refers to the `connectivity` entry in `measures.json`.
- `"statistic": "value"` refers to the `value` entry in `statistics.json`.
- `"dimensions": { "condition": "baseline" }` refers to the `baseline` entry in `condition.json`.

## Node and ROI files

Nodes are represented by ROIs. Their information is split into two top-level files. This section is part of the required input specification, not a separate atlas-upload format.

| File                   | Required | Purpose                                                                                    |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `rois.json`            | Yes      | Defines the identity, matrix position, labels, metadata, and optional center of every ROI. |
| `spatial/manifest.json` | No       | Adds an optional 3D shape to ROIs defined in `rois.json`.                                  |

### `rois.json`

`rois.json` contains one JSON array. Each object describes one ROI, and its `index` connects it to the same row and column in every connectivity matrix.

```json
[
  {
    "index": 0,
    "id": "frontal-l",
    "label": "Frontal L",
    "name": "Left frontal region",
    "coords": {
      "x": -24.1,
      "y": 18.5,
      "z": 42.0,
      "space": "MNI152"
    },
    "metadata": {
      "hemisphere": "left",
      "lobe": "frontal"
    }
  },
  {
    "index": 1,
    "id": "frontal-r",
    "label": "Frontal R",
    "metadata": {
      "hemisphere": "right",
      "lobe": "frontal"
    }
  },
  {
    "index": 2,
    "id": "temporal-l",
    "label": "Temporal L"
  }
]
```

Supported fields:

| Field      | Required | Meaning                                                                                                 |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------- |
| `index`    | Yes      | Zero-based row and column occupied by the ROI in every matrix.                                          |
| `id`       | Yes      | Unique, stable text identifier. The spatial manifest declares which ROI field identifies model objects.                      |
| `label`    | No       | Short display label. If omitted, VAFCA derives one from the index.                                      |
| `name`     | No       | Longer descriptive name. It defaults to `label`.                                                        |
| `atlasId`  | No       | Original string or numeric identifier used by an external atlas.                                        |
| `coords`   | No       | Center of the ROI as numeric `x`, `y`, and `z` values, plus an optional `space`. It may also be `null`. |
| `metadata` | No       | Object containing custom properties used for grouping or filtering, including nested JSON values.       |

Validation rules:

- `index` is required, starts at `0`, and determines the ROI's row and column in every matrix.
- Indexes must be unique and cover the complete range from `0` to `n - 1`.
- The number of ROIs must match the width and height of every matrix.
- Every `id` must be unique and should remain unchanged between imports.
- `coords` must contain numeric `x`, `y`, and `z` values. `space` is optional.
- All matrices in the ZIP use this same ROI order.

### `spatial/manifest.json`

This is the only entry point for additional 3D resources. Without it, VAFCA displays nodes using their `coords`.

```json
{
  "version": 1,
  "coordinate_space": "fsaverage",
  "atlas": {
    "type": "surface-atlas",
    "format": "glb",
    "file": "desikan68.glb",
    "mapping": { "roi_field": "id", "model_field": "name" }
  }
}
```

`atlas.file` is relative to `spatial/`; nested paths such as `atlases/model.glb` work. The supported model format is self-contained GLB. Absolute paths, parent traversal, external model resources and unsupported versions/formats are rejected.

The loader matches the top-level ROI field named by `roi_field` to the GLB object's `name`. Identifiers are case-sensitive; duplicate mapping keys are errors. An object can be a mesh or a group with several meshes. VAFCA reads labels, coordinates and metadata exclusively from `rois.json`.

Coordinates take precedence for link endpoints. A ROI without coordinates uses its geometry's bounding-box center as a visual fallback, with a warning. A ROI without either remains non-spatial. Partial geometry coverage and coordinate-space mismatches generate warnings; no implicit registration occurs.

The atlas loads once per dataset and shares a display transform with markers and dynamic links. Selecting a ROI updates the existing coordinated node selections; selected links emphasize their incident ROIs. Hover displays ROI metadata. Dataset replacement releases the previous model's geometry, materials and textures. Workspace ZIPs include the spatial manifest and GLB.

The former point-cloud geometry format is no longer read or rendered. `use_case_1` is the maintained example: 68 ROIs and 68 mapped model objects.

## Matrix layouts

VAFCA accepts three layouts.

### Full matrix

Use `"layout": "full"` and provide an `n × n` nested array. The matrix must be symmetric:

```json
{
  "layout": "full",
  "data": [
    [0, 0.4, 0.2],
    [0.4, 0, 0.7],
    [0.2, 0.7, 0]
  ]
}
```

### Upper triangular matrix

Use `"layout": "upper_triangular"` and provide one flat array, including the diagonal. Values are read row by row:

```text
(0,0), (0,1), (0,2), (1,1), (1,2), (2,2)
```

```json
{
  "layout": "upper_triangular",
  "data": [0, 0.4, 0.2, 0, 0.7, 0]
}
```

### Lower triangular matrix

Use `"layout": "lower_triangular"`. Values are also a flat array including the diagonal, read row by row:

```text
(0,0), (1,0), (1,1), (2,0), (2,1), (2,2)
```

```json
{
  "layout": "lower_triangular",
  "data": [0, 0.4, 0, 0.2, 0.7, 0]
}
```

For `n` ROIs, a triangular array must contain exactly `n × (n + 1) / 2` values. VAFCA expands it into a symmetric matrix.

## One file per matrix

For larger datasets, you can place each matrix in its own JSON file:

```text
my-dataset/
├── matrices/
│   ├── control-alpha.json
│   └── study-alpha.json
└── catalogs/
    └── ...
```

Each file in `matrices/` contains one matrix object, without the surrounding array. Use either `matrices.json` **or** `matrices/*.json`, never both.

## Catalog options

Most catalog settings are optional. Useful supported values include:

- Source `kind`: `population`, `subject`, or `comparison`.
- Population `n` (optional): the number of subjects used to compute the population statistics, supplied as a positive integer. It is not the ROI count. If omitted, the dataset can still be loaded and explored. Calculations that require sample sizes (the One sample Z-score and Two sample Z-score tabs) ask for an integer greater than 1 for each population without a valid `n`. Values entered in the comparison dialog apply to that calculation and are recorded in the generated network’s derivation; they do not modify the imported catalog. Differences do not require `n`. One sample Z-score needs only the target sample size; Two sample Z-score needs both sample sizes.
- Comparison sources: use `left` and `right` to reference the two source IDs being compared.
- Measure `expectedRange`: two numbers in ascending order, for example `[0, 1]`.
- Statistic `expectedRange`: takes precedence over the measure range. The effective range determines the scale: ranges containing both negative and positive values use a diverging scale centered on zero; other ranges use a sequential scale.
- Statistic `scaleType`: `sequential` or `diverging`, used as a fallback when neither the statistic nor the measure provides a range.
- Statistic `rangeMode`: `inherit_measure`, `non_negative_observed`, `observed`, `observed_symmetric`, or `fixed`.
- Statistic `center`: a number, commonly `0` for diverging data.
- Any catalog item may include `label`, `description`, `enabled`, `order`, and `metadata`.

For example, `catalogs/sources.json` may contain populations with and without `n`:

```json
{
  "controls": { "label": "Healthy controls", "kind": "population", "n": 40 },
  "patients": { "label": "Patients", "kind": "population" }
}
```

### Comparing networks

The **Derive networks** dialog has three method tabs: **Difference**, **One sample Z-score**, and **Two sample Z-score**. Only the active tab is calculated. Difference lets you choose populations or subjects when both are available. Both Z-score tabs use population summary matrices.

There is no dimension-selection section. The dialog automatically processes all dimension contexts already present in the dataset, matching the same dimension values on both sides. Both inputs must use the same selected connectivity measure, node set, and ROI order. Missing matrices, ambiguous inputs, and incompatible ROI orders are skipped and shown in the preview.

**Connectivity measures** (such as Pearson correlation or corrected imaginary coherency) and **input statistics** (such as mean, standard deviation, or median) have separate selectors. Each selected method exposes its input roles:

- **Difference:** choose the left and right statistic to subtract. Any catalog statistic can be used, including a median or standard deviation; differences are not restricted to means.
- **One sample Z-score:** assign the sample mean, reference mean, and known population standard deviation. The reference mean and standard deviation are treated as fixed parameters. The calculation is `(sample mean - reference mean) / (population std / sqrt(n_target))`; only the target sample size is required. Zero, negative or missing standard deviations produce missing output values.
- **Two sample Z-score:** assign the mean and standard deviation for each population.

The identifiers `mean`, `std`, and `value` are initial selections when present, not required catalog names. If your dataset uses different IDs, explicitly map each role to the appropriate catalog statistic. The preview lists the selected inputs. Result labels, comparison-source labels, and provenance distinguish the statistic mappings, so a median difference and a standard-deviation difference can coexist.

The **Absolute value of the result** switch applies to Difference, One sample Z-score, and Two sample Z-score. It takes the magnitude of the final statistic (`|A − B|` or `|Z|`), preserving missing cells. Absolute results have a distinct statistic (`absolute_difference` or `absolute_z_value`), an “absolute” label, a non-negative scale, and an `abs(...)` formula with an explicit flag in their provenance. Signed and absolute networks can coexist. Generated networks retain their input context and statistic mappings.

## Before uploading: checklist

- The upload is one `.zip` file.
- The ZIP does not contain `manifest.json` or an extra parent directory.
- Required files are at the ZIP's top level, not inside an extra parent folder.
- The ZIP contains either `matrices.json` or JSON files under `matrices/`.
- `catalogs/dimensions.json` exists. Prefer also adding the core catalog files and one catalog for each custom dimension.
- All matrices are non-empty and have the same ROI count. Full matrices are square; triangular matrices have exactly `n × (n + 1) / 2` values.
- Full matrices are symmetric.
- Every matrix has a unique `id` and declares `source`, `measure`, `statistic`, and all custom dimensions.
- Matrix values are numbers or `null`; JSON does not support `NaN` or `Infinity`.
- `rois.json` is present, its ROI IDs and indexes are unique, and the indexes cover `0` through `n - 1`.
- If 3D geometry is present, `spatial/manifest.json` declares its GLB file relative to `spatial/`.
- Matrix `source`, `measure`, `statistic`, and custom-dimension values match their corresponding catalog keys exactly.
- GLB object names match the ROI field declared by `atlas.mapping.roi_field`. All identifiers are case-sensitive.

## Saved workspaces

A saved workspace uses this same ZIP data format: `matrices.json`, `rois.json`,
`spatial/manifest.json`, its declared GLB, and `catalogs/*.json`. It adds `session.json` (version
`vafca-workspace-v2`) with views, filters, selected links, camera positions,
rankings, dataset identity, network provenance, and the active atlas.

Use **Open workspace** to restore the complete session, or upload the ZIP as a
dataset to import just its matrices, ROIs, and catalogs. Dataset import ignores
`session.json`. Aggregated networks with a different ROI order are stored in the
session, along with temporary networks, because input matrices share one ROI
order. An empty workspace contains only `session.json` and has no dataset to import.
Previously saved `vafca-workspace-v1` archives can still be opened; new saves use v2.
