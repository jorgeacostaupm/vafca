import {
  schemeAccent,
  schemeCategory10,
  schemeDark2,
  schemePaired,
  schemePastel1,
  schemePastel2,
  schemeSet1,
  schemeSet2,
  schemeSet3,
  schemeTableau10,
} from 'd3'

type GroupingPaletteDefinition = {
  label: string
  palette: readonly string[]
}

export const D3_GROUPING_PALETTES = {
  category10: {
    label: 'D3 Category 10',
    palette: schemeCategory10.slice(0, 6),
  },
  tableau10: {
    label: 'D3 Tableau 10',
    palette: schemeTableau10,
  },
  accent: {
    label: 'D3 Accent',
    palette: schemeAccent,
  },
  dark2: {
    label: 'D3 Dark 2',
    palette: schemeDark2,
  },
  paired: {
    label: 'D3 Paired',
    palette: schemePaired,
  },
  pastel1: {
    label: 'D3 Pastel 1',
    palette: schemePastel1,
  },
  pastel2: {
    label: 'D3 Pastel 2',
    palette: schemePastel2,
  },
  set1: {
    label: 'D3 Set 1',
    palette: schemeSet1,
  },
  set2: {
    label: 'D3 Set 2',
    palette: schemeSet2,
  },
  set3: {
    label: 'D3 Set 3',
    palette: schemeSet3,
  },
} satisfies Record<string, GroupingPaletteDefinition>

export type D3GroupingPaletteKey = keyof typeof D3_GROUPING_PALETTES

export const DEFAULT_D3_GROUPING_PALETTE: D3GroupingPaletteKey = 'tableau10'
