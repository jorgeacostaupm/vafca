import { useMemo } from 'react'

import { useAppSelector } from '@/store/hooks'
import { selectAnnotationLinkColors, selectAnnotationNodeColors } from '@/store/slices/visualizationUi/annotationSelectors'
import type { MatrixVisualStyle } from '@/types/visualizationUi'

export function useAnnotationStyle<T extends MatrixVisualStyle>(style: T, visible = true): T {
  const links = useAppSelector(selectAnnotationLinkColors)
  const nodes = useAppSelector(selectAnnotationNodeColors)
  const color = useAppSelector(state => state.visualizationUi.annotations.find(item => item.id === state.visualizationUi.activeAnnotationId)?.color)
  return useMemo(() => ({ ...style, highlightColor: color ?? style.highlightColor, selectionColor: color ?? style.selectionColor,
    annotationLinkColors: visible ? links : undefined,
    annotationNodeColors: visible ? nodes : undefined,
  }), [style, color, links, nodes, visible])
}
