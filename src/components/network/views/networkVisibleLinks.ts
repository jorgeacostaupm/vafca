import { buildLinkKey } from "@/components/network/networkFormatting";
import type { buildNetworkViewRenderData } from "@/components/network/views/networkViewData";
import { NETWORK_LINKS_3D_LIMIT } from "@/config/ui";
import type { NetworkViewValueFilters } from "@/types/networkViews";
import type { SelectedLink } from "@/types/visualizationUi";
import { valuePassesRangeFilter } from "@/utils/matrixFiltering";
import { findSelectedLinkId } from "@/utils/selectedLinkKeys";

export function buildNetworkLinkCandidates(
  renderData: ReturnType<typeof buildNetworkViewRenderData>,
  filters: NetworkViewValueFilters,
  compoundId: string,
  labelNames: Record<string, string>,
): SelectedLink[] {
  const { data } = renderData.payload;
  const rowLabels = renderData.type === "matrix" ? renderData.payload.rowLabels : renderData.payload.labels;
  const colLabels = renderData.type === "matrix" ? renderData.payload.colLabels : renderData.payload.labels;
  const rows: SelectedLink[] = [];
  const seen = new Set<string>();
  for (let row = 0; row < rowLabels.length; row += 1) {
    for (let col = 0; col < colLabels.length; col += 1) {
      const rowId = rowLabels[row];
      const colId = colLabels[col];
      const value = data[row]?.[col];
      if (rowId === colId || !Number.isFinite(value) || !value) continue;
      const key = buildLinkKey(rowId, colId);
      if (seen.has(key) || !valuePassesRangeFilter(value, filters.stat)) continue;
      if (filters.percentLinkIds && !filters.percentLinkIds.has(key)) continue;
      seen.add(key);
      const rowLabel = labelNames[rowId] ?? rowId;
      const colLabel = labelNames[colId] ?? colId;
      rows.push({ id: key, rowId, colId, rowLabel, colLabel,
        sources: [{ compoundId, networkLabel: compoundId, value }] });
    }
  }
  // ponytail: sort all visible links (O(E log E)); use a bounded heap if large networks need it.
  rows.sort((a, b) => Math.abs(b.sources[0].value) - Math.abs(a.sources[0].value));
  return rows;
}

export function selectNetworkVisibleLinks(rows: SelectedLink[], selectedLinks: Record<string, SelectedLink>) {
  const links = rows.filter((link, index) =>
    index < NETWORK_LINKS_3D_LIMIT || findSelectedLinkId(selectedLinks, link.rowId, link.colId) !== undefined);
  return { links, isAutomaticallyFiltered: links.length < rows.length };
}

export function buildNetworkVisibleLinks(
  renderData: ReturnType<typeof buildNetworkViewRenderData>,
  filters: NetworkViewValueFilters,
  compoundId: string,
  labelNames: Record<string, string>,
  selectedLinks: Record<string, SelectedLink> = {},
) {
  return selectNetworkVisibleLinks(buildNetworkLinkCandidates(renderData, filters, compoundId, labelNames), selectedLinks);
}
