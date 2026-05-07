# Matrix JSON format

Matrix uploads accept JSON files containing one matrix, an array of matrices, or
a dataset-like object with a `matrices` array.

## Accepted top-level shapes

Single matrix:

```json
{
  "id": "alpha-power-z-control",
  "bandId": "alpha",
  "measureId": "plv",
  "statId": "z_score",
  "populationIds": ["control"],
  "data": [
    [0, 0.25, -0.1],
    [0.25, 0, 0.4],
    [-0.1, 0.4, 0]
  ]
}
```

List of matrices:

```json
[
  {
    "id": "alpha-power-z-control",
    "bandId": "alpha",
    "measureId": "plv",
    "statId": "z_score",
    "populationIds": ["control"],
    "data": [
      [0, 0.25],
      [0.25, 0]
    ]
  }
]
```

Dataset-like payload:

```json
{
  "metadata": {
    "matrixOrder": [
      { "id": "roi-1", "label": "ROI 1", "hemisphere": "left", "network": "DMN" },
      { "id": "roi-2", "label": "ROI 2", "hemisphere": "right", "network": "DMN" }
    ]
  },
  "matrices": [
    {
      "id": "alpha-power-z-control",
      "bandId": "alpha",
      "measureId": "plv",
      "statId": "z_score",
      "populationIds": ["control"],
      "data": [
        [0, 0.25],
        [0.25, 0]
      ]
    }
  ]
}
```

## Required fields

- `id`: non-empty string that identifies the matrix.
- `bandId`: non-empty string. It must exist in the current dataset band catalog.
- `measureId`: non-empty string. It must exist in the current dataset measure catalog.
- `statId`: non-empty string. It must exist in the current dataset stat catalog.
- `populationIds`: non-empty array of strings. Every id must exist in the current dataset population catalog.
- `data`: square two-dimensional array of finite numbers.

When the current dataset defines `metadata.matrixOrder`, `data.length` must
match the number of ROI entries in that order. Each row must have the same
length as the number of rows.

## Matrix-derived atlas

The matrix uploader includes an option to reset the currently loaded atlas.
When enabled, valid uploaded matrices replace the active atlas with a minimal
atlas derived from the matrix labels:

- If the uploaded JSON contains `metadata.matrixOrder` or top-level
  `matrixOrder`, those ids and labels are used. Extra scalar fields in each
  order entry, such as `hemisphere`, `lobe`, `region`, or `network`, are copied
  into the generated ROIs and become available in grouping/filter/color menus.
- If no matrix order is provided, ROI ids and labels are generated from the
  first valid matrix size.
- The generated atlas does not include mesh points or coordinates unless those
  fields are provided by a separate atlas upload.

## Loading behavior

Valid matrices are loaded into the current dataset. Invalid matrix entries are
skipped, and the interface reports their source file, matrix id when available,
and validation message.

Matrices are stored by the compound key:

```text
bandId::measureId::statId::sortedPopulationIds
```
