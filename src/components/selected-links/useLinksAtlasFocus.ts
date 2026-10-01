import { useMemo, useState } from 'react';

import type { AtlasDefinition } from '@/types/atlas';
import type { SelectedLink } from '@/types/visualizationUi';
import { getCommonNodeFields } from '@/utils/atlas/atlasDefinition';

import { filterLinksAtlas } from './linksAtlasFocus';

export function useLinksAtlasFocus(atlas: AtlasDefinition | null, links: SelectedLink[]) {
  const [roi, setRoi] = useState<string>();
  const [field, setField] = useState<string>();
  const [module, setModule] = useState<string>();
  const roiOptions = useMemo(() => atlas?.nodes.map(node => ({
    value: String(node.id), label: `${node.label || node.name} (${node.atlasId})`,
  })) ?? [], [atlas]);
  const fields = useMemo(() => getCommonNodeFields(atlas), [atlas]);
  const activeField = field && fields.includes(field) ? field : undefined;
  const modules = useMemo(() => [...new Set(atlas?.nodes.flatMap(node => {
    const value = activeField ? node.metadata?.[activeField] : undefined;
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? [String(value)] : [];
  }) ?? [])].sort(), [atlas, activeField]);
  const activeRoi = roiOptions.some(option => option.value === roi) ? roi : undefined;
  const activeModule = module !== undefined && modules.includes(module) ? module : undefined;
  const filtered = useMemo(() => filterLinksAtlas(links, atlas?.nodes ?? [], activeRoi, activeField, activeModule),
    [links, atlas, activeRoi, activeField, activeModule]);
  return { links: filtered, roi: activeRoi, setRoi, field: activeField,
    setField: (value: string | undefined) => { setField(value); setModule(undefined); },
    module: activeModule, setModule, roiOptions, fields, modules,
    isFiltered: activeRoi !== undefined || activeModule !== undefined,
    reset: () => { setRoi(undefined); setField(undefined); setModule(undefined); },
  };
}

