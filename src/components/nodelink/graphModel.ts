import type { NodeLinkValueFilters, UndirectedLink } from "@/types/nodelink";
import { valuePassesRangeFilter } from "@/utils/matrixFiltering";


export const buildFilteredUndirectedLinks = (args: {
  data: number[][];
  labels?: string[];
  valueFilters?: NodeLinkValueFilters;
}) => {
  const { data, labels, valueFilters } = args;
  const links: UndirectedLink[] = [];
  const size = data.length;
  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) {
      const value = data[i]?.[j] ?? data[j]?.[i] ?? 0;
      if (!Number.isFinite(value)) continue;
      if (!valuePassesRangeFilter(value, valueFilters?.measure)) continue;
      if (!valuePassesRangeFilter(value, valueFilters?.stat)) continue;
      if (!value) continue;
      links.push({
        source: i,
        target: j,
        value,
        rowId: labels?.[i] ?? String(i),
        colId: labels?.[j] ?? String(j),
      });
    }
  }
  return links;
};

export const buildDegreeByLabelId = (links: Array<{ rowId: string; colId: string }>) => {
  const degreeById = new Map<string, number>();
  links.forEach((link) => {
    degreeById.set(link.rowId, (degreeById.get(link.rowId) ?? 0) + 1);
    degreeById.set(link.colId, (degreeById.get(link.colId) ?? 0) + 1);
  });
  return degreeById;
};
