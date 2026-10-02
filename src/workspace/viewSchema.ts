import { z } from 'zod';

import { matrix, record, stringMap, strings } from './dataSchema';
const range = z.tuple([z.number(), z.number()]);
const zoom = z.object({
  rows: strings,
  cols: strings,
  linkIds: strings.optional()
}).nullable();
const viewType = z.enum(['matrix', 'circular', 'classic']);
const settings = z.object({
  labels: strings.optional(),
  statRange: z.union([range, z.object({ negative: range, positive: range, negativeEnabled: z.boolean().optional(), positiveEnabled: z.boolean().optional() })]).optional(),
  measureRange: range.optional(),
  hideIsolatedNodes: z.boolean().optional(),
  zoomHistory: z.array(zoom).optional(),
  zoomIndex: z.number().int().nonnegative().optional(),
  zoomLinkPercent: z.number().optional(),
  percentLinkFilter: z.object({
    mode: z.enum(['top', 'bottom', 'absoluteTop', 'absoluteBottom']),
    percent: z.number().min(1).max(100),
    includeAutoconnections: z.boolean()
  }).nullable().optional(),
  useAsNodeFilter: z.boolean().optional(),
  useAsLinkFilter: z.boolean().optional(),
  brushEnabled: z.boolean().optional(),
  brushMode: z.enum(['zoom', 'selectLinks', 'deselectLinks']).optional(),
  geometricZoomEnabled: z.boolean().optional(),
  linkWidthRange: range.optional(),
  circularLinkTension: z.number().optional(),
  circularBundlingEnabled: z.boolean().optional(),
  circularPositiveLinkColor: z.string().optional(),
  circularNegativeLinkColor: z.string().optional(),
});
const controls = z.object({
  viewType,
  matrixSelectorMode: z.enum(['combined', 'fields']),
  sourceId: z.string(),
  measureId: z.string(),
  statisticId: z.string(),
  aspectFilters: stringMap,
  selectedCompoundId: z.string(),
  syncZoom: z.boolean(),
  hideIsolatedNodes: z.boolean(),
  circularLinkTension: z.number(),
  circularBundlingEnabled: z.boolean(),
  circularPositiveLinkColor: z.string(),
  circularNegativeLinkColor: z.string(),
  percentZoomIncludeAutoconnections: z.boolean()
});
export const viewsSchema = z.object({
  selectedNodeIds: strings.default([]),
  controls,
  controlsByViewType: record(controls),
  viewsOrder: strings,
  viewsById: record(z.object({
    id: z.string(),
    type: viewType,
    compoundId: z.string(),
    temporaryNetworkId: z.string().optional(),
    sourceCompoundId: z.string().optional(),
    coordinationDisabled: z.boolean().optional(),
    label: z.string(),
    measureId: z.string(),
    statisticId: z.string(),
    status: z.enum(['ready', 'error', 'formatting']),
    error: z.string().optional(),
    loadingMessage: z.string().optional()
  })),
  temporaryNetworksById: record(z.object({
    id: z.string(),
    sourceViewId: z.string(),
    sourceNetworkLabel: z.string(),
    label: z.string(),
    measureId: z.string(),
    statisticId: z.string(),
    data: matrix,
    rowLabels: strings,
    colLabels: strings,
    symmetric: z.boolean(),
    groups: z.array(z.object({
      id: z.string(),
      label: z.string(),
      criteria: stringMap,
      nodeIds: strings
    })),
    labelNames: stringMap,
    labelTitles: stringMap,
    labelAcronyms: stringMap,
    nodeColors: stringMap,
    createdAt: z.string()
  })),
  matrixSettingsByViewId: record(settings),
  nodeLinkSettingsByViewId: record(settings),
  nextViewSeq: z.number().int().positive(),
});
export const layoutSchema = z.object({ layout: z.array(z.object({
  i: z.string(),
  x: z.number().nonnegative(),
  y: z.number().nonnegative(),
  w: z.number().positive(),
  h: z.number().positive()
})) });
