# VAFCA ZIP dataset format

User datasets are imported as a single ZIP file. The ZIP is normalized by the
application into one debuggable JSON model before the workspace is updated.

## ZIP structure

Minimum:

```text
dataset.zip
  matrices.json
```

With ROI metadata:

```text
dataset.zip
  rois.json
  matrices.json
  manifest.json
  catalogs/
    layers.json
    measures.json
    populations.json
    stats.json
```

With one matrix per file:

```text
dataset.zip
  rois.json
  manifest.json
  matrices/
    alpha-control.json
    beta-control.json
```

Use either `matrices.json` or `matrices/`, not both. File names inside
`matrices/` are only used in validation messages.

## matrices.json

`matrices.json` contains a list of matrix objects. The only required field per
matrix is `data`.

```json
[
  {
    "id": "alpha-control",
    "label": "Alpha control",
    "layout": "full",
    "n": 24,
    "data": [
      [0, 0.2],
      [0.2, 0]
    ]
  }
]
```

`layer`, `measure`, `stat`, and `population` are optional per matrix. When they
are missing, VAFCA assigns internal fallbacks:

- `layer`: `layer-1`, `layer-2`, `layer-3`, and so on, based on matrix order.
- `measure`: `Unknown`.
- `stat`: `Unknown`.
- `population`: `Unknown`.

These fallbacks are only a loading aid. Add explicit metadata to matrices when
users need to compare, filter, or identify them by layer, measure, statistic, or
population.

In `matrices/`, each file may contain the same object shape or a raw matrix
array:

```json
[
  [0, 0.2],
  [0.2, 0]
]
```

`layout` describes how `data` is encoded:

- `full`: square two-dimensional matrix.
- `upper_triangular`: flat array with the upper triangle, including diagonal.
- `lower_triangular`: flat array with the lower triangle, including diagonal.

For triangular layouts, `data.length` must be `n * (n + 1) / 2`. The importer
materializes the missing side internally only when the matrix is declared
`symmetric`. Non-symmetric triangular matrices keep the unstored side as
missing values.

```json
{
  "layout": "upper_triangular",
  "data": [0, 0.2, 0.3, 0, 0.4, 0]
}
```

## rois.json

`rois.json` is optional. If it is missing, VAFCA generates generic labels such
as `ROI-1`, `ROI-2`, and so on from the matrix size.

When provided, it must contain ROI objects. `index` is the position in every
matrix.

```json
[
  {
    "index": 0,
    "id": "frontal-l",
    "label": "Frontal L",
    "tags": {
      "hemisphere": "left",
      "lobe": "frontal",
      "network": "DMN"
    }
  }
]
```

`tags` must contain grouping/filter/color fields. Do not put ROI category
fields at the top level.

## manifest.json

`manifest.json` is optional in lenient import and required in strict import.

```json
{
  "formatVersion": "vafca-zip-v1",
  "name": "Demo dataset",
  "directedNetworks": false
}
```

`directedNetworks` declares matrix semantics, not storage. When it is `false`,
`A-B` and `B-A` are the same undirected link and matrices are treated as
symmetric. When it is `true`, both directions are preserved independently.

## catalogs/

`catalogs/` is optional and only provides labels or display metadata. Each
catalog type lives in its own JSON file.

```text
catalogs/
  layers.json
  measures.json
  populations.json
  stats.json
```

Example `catalogs/measures.json`:

```json
{
  "plv": { "label": "PLV", "expectedRange": [0, 1] }
}
```

Legacy `catalogs.json` is still accepted for compatibility, but do not combine
it with `catalogs/` in the same ZIP.

## Import modes

Lenient mode loads usable data and records internally inferred fields.

Strict mode blocks missing `manifest.json`, missing `rois.json`, missing matrix
metadata, and generated ids.
