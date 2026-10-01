import { z } from 'zod';
export const strings = z.array(z.string());
export const stringMap = z.record(z.string(), z.string());
export const record = <T extends z.ZodType>(schema: T) => z.record(z.string(), schema);
const metadata = record(z.json());
const nullableNumber = z.number().nullable();
export const matrix = z.array(z.array(nullableNumber));
const domain = z.object({
  min: nullableNumber,
  max: nullableNumber,
  center: nullableNumber,
  units: z.string().nullable().optional()
});
const coords = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  space: z.string().optional()
});
export const node = z.object({
  id: z.string(),
  label: z.string(),
  name: z.string().optional(),
  index: z.number().int().nonnegative().optional(),
  atlasId: z.union([z.string(), z.number()]).optional(),
  metadata,
  coords: coords.nullable().optional(),
});
const catalog = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
  metadata: metadata.optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  expectedRange: z.tuple([z.number(), z.number()]).nullable().optional(),
  valueDomain: domain.optional(),
  useDataRange: z.boolean().optional()
}).passthrough();
const network = z.object({
  id: z.string(),
  label: z.string().optional(),
  sourceId: z.string(),
  measureId: z.string(),
  statisticId: z.string(),
  dimensions: stringMap,
  nodeSetId: z.string(),
  nodeIds: strings,
  data: z.discriminatedUnion('format', [
        z.object({
    format: z.literal('matrix'),
    layout: z.enum(['full', 'upper_triangular', 'lower_triangular']),
    values: z.union([matrix, z.array(nullableNumber)]),
    missingValue: nullableNumber,
    dtype: z.enum(['float32', 'float64']).optional()
  }),
        z.object({ format: z.literal('edge-list'), edges: z.array(z.object({
    sourceId: z.string(),
    targetId: z.string(),
    value: z.number()
  })) }),
    ]),
  valueDomain: domain.optional(),
  provenance: z.object({
    generatedBy: z.string(),
    dependencies: strings,
    parameters: metadata
  }).passthrough(),
  derivation: z.discriminatedUnion('type', [
        z.object({
    type: z.literal('comparison'),
    operator: z.string(),
    comparisonType: z.string(),
    formula: z.string(),
    parameters: metadata,
    leftNetworkId: z.string().nullable().optional(),
    rightNetworkId: z.string().nullable().optional()
  }).passthrough(),
        z.object({
    type: z.literal('aggregation'),
    groups: z.array(z.object({
      id: z.string(),
      label: z.string(),
      criteria: stringMap,
      nodeIds: strings
    })),
    fields: strings,
    baseNetworkId: z.string(),
    source: z.enum(['visualizationSettings', 'manual']),
    sourceNodeSetId: z.string(),
    aggregator: z.literal('mean'),
    formula: z.string(),
    parameters: z.object({
      baseNetworkId: z.string(),
      fields: strings,
      aggregator: z.literal('mean'),
      ignoreMissing: z.boolean(),
      includeInactiveNodes: z.boolean(),
      missingNodePolicy: z.enum(['unknown_group', 'exclude', 'error']),
      groupOrderHash: z.string().optional(),
      orderMode: z.enum(['matrix', 'circular']).optional(),
      withinGroupMode: z.literal('upperTriangleNoDiagonal'),
      betweenGroupMode: z.literal('allPairs'),
      activeNodeSetHash: z.string()
    }),
    cellCounts: z.array(z.array(z.number().int().nonnegative())),
    missingNodePolicy: z.enum(['unknown_group', 'exclude', 'error']),
    excludedNodeIds: strings,
    activeNodeSetHash: z.string(),
    groupOrderHash: z.string().optional(),
    stale: z.boolean().optional(),
    staleReason: z.string().nullable().optional(),
  }),
    ]).optional(),
});
export const datasetSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  nodeSet: z.object({
    id: z.string(),
    label: z.string(),
    terminology: z.object({ singular: z.string(), plural: z.string() }),
    nodes: z.array(node)
  }).passthrough(),
  catalogs: z.object({
    core: z.object({
      source: catalog,
      measure: catalog,
      statistic: catalog
    }),
    aspects: z.array(catalog),
    sources: record(catalog.extend({
      kind: z.enum(['population', 'subject', 'comparison']),
      n: z.number().positive().optional(),
      left: z.string().optional(),
      right: z.string().optional()
    })),
    measures: record(catalog),
    statistics: record(catalog.extend({
      scaleType: z.enum(['sequential', 'diverging']),
      center: nullableNumber,
      rangeMode: z.enum(['inherit_measure', 'non_negative_observed', 'observed', 'observed_symmetric', 'fixed'])
    })),
    aspectCatalogs: record(record(catalog)),
  }),
  networks: z.array(network),
}).nullable();
export const atlasSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(node.extend({
    index: z.number().int().nonnegative(),
    name: z.string(),
    atlasId: z.union([z.string(), z.number()])
  }))
}).passthrough().nullable();
