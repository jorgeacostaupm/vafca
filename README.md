# VAFCA

VAFCA is a React application for exploring functional connectivity datasets.
It loads network packages made of ROI/node metadata, connectivity matrices,
catalogs, and visualization settings, then lets users inspect, compare, filter,
rank, and derive connectivity networks in an interactive workspace.

The app is focused on neuroimaging-style connectivity data: populations,
subjects, measures, statistics, frequency or condition layers, atlases, ROIs,
and links between regions.

## Highlights

- Load VAFCA ZIP datasets with lenient validation and visible import issues.
- Inspect the loaded dataset, catalogs, matrix counts, populations, measures,
  statistics, layers, and network metadata.
- Select networks directly or by fields such as population, measure, statistic,
  and layer.
- Open multiple network panels in a draggable and resizable workspace.
- Render connectivity as matrix heatmaps, circular graphs, or classic
  node-link graphs.
- Use coordinated zoom, brush selection, label selection, SVG export, and
  per-panel filter controls.
- Manage an atlas, import atlas JSON files, inspect ROI metadata, filter and
  group nodes, and view atlas nodes in 3D using ROI coordinates and optional GLB geometry declared in `spatial/manifest.json`.
- Build edge filters for original and aggregated networks.
- Compute derived comparison networks, including population differences,
  z-scores, effect sizes, Welch t-tests, two-sample z-tests, and subject-level
  comparisons.
- Aggregate node-to-node networks into group-to-group networks using the
  active atlas grouping.
- Rank networks, links, or nodes and save relevant links for focused review.
- Analyze selected links across multiple networks and download the selected
  link table.

## Tech Stack

- React 19
- TypeScript
- Redux Toolkit and React Redux
- Ant Design
- D3
- Three.js
- fflate for ZIP import
- Zod for schema-oriented validation
- Vite

## Data

If you want to prepare your own input files, see the
[user guide for preparing and loading data](docs/manual-carga-datos.md). It
includes the ZIP structure, JSON examples, matrix layouts, atlas formats, and a
troubleshooting checklist.

All networks are undirected; no direction setting is required. Full imported
matrices must be symmetric (numeric tolerance: 1e-6), including matching missing
values. Triangular matrices are mirrored automatically. Asymmetric matrices
produce an import error. Run `node scripts/check-undirected-networks.mjs` to
check import validation, link selection, aggregation, and the example ZIPs.

The application works with normalized connectivity datasets. A dataset can
include:

- A node set / atlas definition.
- Catalogs for layers, measures, statistics, populations, and subjects.
- Matrix or edge-list networks.
- Network context, provenance, value domains, and derivation metadata.

Example datasets and atlas files live under `public/data`. The default startup
configuration is in `src/config/initialData.ts`.

## Main App Areas

### Networks

The main workspace for selecting networks, opening visual panels, running
rankings, computing derived networks, and configuring visualization behavior.
Network views can be shown as matrices, circular graphs, or node-link graphs.

### Atlas

The atlas area shows ROI metadata, filters, grouping controls, node visibility,
and a 3D atlas viewer when compatible mesh point data is available.

### Selected Links

The selected links area collects links chosen from matrix views, graph views, or
ranking results. It compares those links across selected networks and supports
download of the selected link data.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Preview a production build:

```bash
npm run preview
```

## Project Structure

```text
src/
  components/          React UI grouped by feature
  config/              UI constants, initial data, palettes, color scales
  hooks/               Shared React hooks
  networkDerivation/   Network comparison and aggregation logic
  store/               Redux store, slices, thunks, listeners
  styles/              CSS layers: base, layout, components, features
  types/               Domain and UI TypeScript types
  utils/               Import, metadata, filtering, ranking, atlas utilities
public/data/           Example datasets and atlas JSON files
scripts/               Dataset/example generation scripts
docs/                  Project documentation
```

## Development Notes

- Global visual tokens are defined in `src/theme.ts` and exposed as CSS
  variables.
- Numeric UI and behavior constants live in `src/config/ui.ts`.
- Feature CSS is organized under `src/styles/features`.
- Ant Design global overrides live in
  `src/styles/components/antd-overrides.css`.
- Shared state belongs in Redux slices and should be accessed through selectors
  instead of prop drilling.
- Heavy or asynchronous dataset operations should use Redux Toolkit thunks.

## Current Documentation

- `docs/app-summary.md` contains a more detailed functional summary of the app.
- `docs/manual-carga-datos.md` explains the accepted input formats step by step
  for end users.
