import { useCallback, useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAnnotationLinkColors, selectAnnotationNodeColors, selectCurrentAnnotation, toggleAnnotationNode } from '@/store/slices/visualizationUi';

export function useSpatialSelection() {
  const dispatch = useAppDispatch();
  const links = useAppSelector(selectAnnotationLinkColors);
  const nodes = useAppSelector(selectAnnotationNodeColors);
  const colors = useMemo(() => ({ links, nodes }), [links, nodes]);
  const current = useAppSelector(selectCurrentAnnotation);
  const labels = useAppSelector(state => state.atlasUi.labelsById);
  const selected = useMemo(() => new Set(Object.keys(colors.nodes)), [colors.nodes]);
  const incident = useMemo(() => new Set(Object.keys(colors.links).flatMap(key => key.split('::'))), [colors.links]);
  const selectNode = useCallback((id: string) => {
    dispatch(toggleAnnotationNode({ id, label: labels[id]?.label ?? id }));
  }, [dispatch, labels]);
  return useMemo(() => ({ selected, incident, color: current.color, colors, selectNode }),
    [selected, incident, current.color, colors, selectNode]);
}
