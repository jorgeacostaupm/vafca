import { z } from 'zod';

import { D3_GROUPING_PALETTES } from '@/config/groupingPalettes';
import { createAnnotation, DEFAULT_ANNOTATION_OVERLAP_COLOR } from '@/store/slices/visualizationUi/annotationDefaults';
import { initialVisualizationUiState } from '@/store/slices/visualizationUi/visualizationUiTypes';
import type { NetworkFilterExpression } from '@/types/edgeFilter';

import { record, stringMap, strings } from './dataSchema';
import { layoutSchema, viewsSchema } from './viewSchema';
const colorSettings = z.object({
  scaleId: z.string(),
  invert: z.boolean(),
  discretize: z.boolean(),
  discreteSteps: z.number().positive(),
  highlightColor: z.string(),
  selectionColor: z.string()
});
const colors = z.object({ sequential: colorSettings, diverging: colorSettings });
const style = z.object({
  highlightColor: z.string(),
  selectionColor: z.string(),
  backgroundColor: z.string().optional(),
  positiveLinkColor: z.string().optional(),
  negativeLinkColor: z.string().optional()
});
const query = z.object({
  target: z.enum(['networks', 'links', 'nodes']),
  mode: z.enum(['singleNetwork', 'networkCollection']),
  linkCollectionMode: z.enum(['aggregated', 'expanded']).optional(),
  allowLinkRankingAutoconnections: z.boolean(),
  allowNodeRankingAutoconnections: z.boolean(),
  sourceIds: z.array(z.string()).optional(),
  sourceId: z.string().optional(),
  networkKind: z.enum(['population', 'subject', 'comparison', 'aggregation']).optional(),
  aggregationGroupingKey: z.string().optional(),
  measureId: z.string().optional(),
  statisticId: z.string().optional(),
  aspectFilters: record(strings).optional(),
  networkId: z.string().optional(),
  networkIds: strings.optional(),
  scope: z.enum(['allLinks', 'activeNodes', 'activeFilter', 'selectedLinks']),
  metric: z.string().optional(),
  threshold: z.number().optional(),
  topN: z.union([z.literal(10), z.literal(25), z.literal(50), z.literal(100), z.literal(250), z.literal(500)])
});
const join = z.enum(['AND', 'OR']);
const expression: z.ZodType<NetworkFilterExpression> = z.lazy(() => z.discriminatedUnion('type', [
    z.object({
  type: z.literal('rule'),
  id: z.string(),
  joinOperator: join.optional(),
  networkId: z.string(),
  operator: z.enum(['between', 'outside', 'lt', 'lte', 'gt', 'gte', 'abs_gte', 'abs_between', 'negative_and_positive_ranges']),
  min: z.number().nullable(),
  max: z.number().nullable(),
  negativeMin: z.number().nullable().optional(),
  negativeMax: z.number().nullable().optional(),
  positiveMin: z.number().nullable().optional(),
  positiveMax: z.number().nullable().optional(),
  includeMin: z.boolean(),
  includeMax: z.boolean()
}),
    z.object({
  type: z.literal('group'),
  id: z.string(),
  operator: join,
  joinOperator: join.optional(),
  children: z.array(expression)
}),
]));
const filter = z.object({ root: expression.refine(value => value.type === 'group'), uiRangeMode: z.enum(['view_observed', 'shared', 'catalog']).transform(value => value === 'catalog' ? 'view_observed' as const : value) }).nullable();
const vector = z.tuple([z.number(), z.number(), z.number()]);
const savedLinks = z.array(z.object({
      id: z.string(),
      rowId: z.string(),
      colId: z.string(),
      rowLabel: z.string(),
      colLabel: z.string(),
      sources: z.array(z.object({
        compoundId: z.string(),
        networkLabel: z.string(),
        value: z.number().nullable()
      }))
    }));
const annotationColor = z.string().regex(/^#[0-9a-f]{6}$/i);
const annotationSchema = z.object({
  id: z.string().min(1), name: z.string().trim().min(1), description: z.string(), color: annotationColor,
  active: z.boolean(), nodes: z.array(z.object({ id: z.string().min(1), label: z.string() })),
  selectedLinks: savedLinks, atlasLinkIds: strings,
});
export const sessionSchema = z.object({
  workspaceUi: z.object({
    activeSection: z.enum(['vis', 'derive', 'atlas', 'links', 'catalogs', 'settings']),
    selectedNetworkIds: strings,
    dismissedNetworkIds: strings,
    linksViewEnabled: z.boolean(),
    linksViewType: z.enum(['matrix', 'circular']),
    linksNodeMode: z.enum(['connected', 'all']),
    cameras: record(z.object({
      position: vector,
      target: vector,
      zoom: z.number().positive()
    }))
  }),
  atlasUi: z.object({
    order: strings,
    labelsById: record(z.object({
      id: z.string(),
      label: z.string(),
      name: z.string().optional(),
      acronym: z.string().optional(),
      metadata: record(z.json()).optional(),
      enabled: z.boolean()
    })),
    initialized: z.boolean(),
    colorFields: strings,
    aggregationFields: strings,
    colorPalette: z.string().refine(value => Object.hasOwn(D3_GROUPING_PALETTES, value)),
    circularHierarchyFields: strings,
    circularHierarchyCategoryOrder: record(strings),
    matrixHierarchyFields: strings,
    matrixHierarchyCategoryOrder: record(strings)
  }),
  visualizationUi: z.object({
    selectedLinks: savedLinks.optional(),
    atlasLinkIds: strings.optional(),
    annotations: z.array(annotationSchema).min(1).optional(),
    currentAnnotationId: z.string().optional(),
    activeAnnotationId: z.string().nullable().optional(),
    annotationOverlapColor: annotationColor.default(DEFAULT_ANNOTATION_OVERLAP_COLOR),
    uiRangeMode: z.enum(['view_observed', 'shared', 'catalog']).transform(value => value === 'catalog' ? 'view_observed' as const : value),
    matrixColorSettings: z.object({
      applied: colors,
      draft: colors,
      backgroundColor: z.object({ applied: z.string(), draft: z.string() })
    }),
    nodeLinkVisualStyle: style,
    circularVisualStyle: style,
    spatialVisualStyle: z.object({ nodeColor: z.string(), divergingNodeColor: z.string(), positiveLinkColor: z.string(), negativeLinkColor: z.string(), neutralLinkColor: z.string() }).default(initialVisualizationUiState.spatialVisualStyle),
    atlasPanel: z.object({
      query: z.string(),
      groupByFields: strings,
      groupByFieldsInitialized: z.boolean(),
      selectedFilters: stringMap,
      collapsedGroups: strings,
      nodeVisibilityDraft: record(z.boolean()).nullable(),
      viewerHeight: z.number().positive(),
      is3dAvailable: z.boolean(),
      spatialMode: z.enum(['geometry', 'points', 'none'])
    }),
  }).transform(({ selectedLinks, atlasLinkIds, annotations, currentAnnotationId, activeAnnotationId, ...ui }) => ({
    ...ui,
    annotations: annotations ?? [{ ...createAnnotation('default', 'Annotation 1'), selectedLinks: selectedLinks ?? [], atlasLinkIds: atlasLinkIds ?? [] }],
    currentAnnotationId: currentAnnotationId ?? annotations?.at(-1)?.id ?? 'default',
    activeAnnotationId: activeAnnotationId === undefined ? (currentAnnotationId ?? annotations?.at(-1)?.id ?? 'default') : activeAnnotationId,
  })),
  networkVisualization: viewsSchema,
  networkLayout: layoutSchema,
  networkFilters: z.object({ activeNetworkFilter: filter, activeAggregatedNetworkFilter: filter }),
  rankings: z.object({
    activeTab: z.enum(['views', 'rankings']),
    currentQuery: query,
    queriesByTarget: record(query),
    resultsOrder: strings,
    resultsById: record(z.object({
      id: z.string(),
      query,
      createdAt: z.string()
    })),
    nextResultSeq: z.number().int().positive()
  }),
});
