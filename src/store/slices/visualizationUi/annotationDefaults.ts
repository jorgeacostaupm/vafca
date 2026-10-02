import { DEFAULT_MATRIX_COLOR_SETTINGS } from '@/config/matrixColorScales'
import { appColors } from '@/theme'
import type { Annotation } from '@/types/visualizationUi'

export const DEFAULT_ANNOTATION_OVERLAP_COLOR = appColors.annotationOverlap
export const createAnnotation = (id: string, name: string): Annotation => ({
  id, name, description: '', active: true,
  color: DEFAULT_MATRIX_COLOR_SETTINGS.sequential.highlightColor,
  nodes: [], selectedLinks: [], selectedLinksById: {}, selectedLinkIdsByRowId: {}, atlasLinkIds: [], atlasNodeIds: [],
})
