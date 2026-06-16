import type {
  BuildLinkValuesParams,
  BuildRowsParams,
  DownloadMode,
  ExportedLink,
  LinkRow,
  NetworkColumn,
  NetworkLookup,
  NetworkOption,
  SelectedLinksExportPayload,
} from "@/components/selected-links/selectedLinksPanel.types";
import type { SelectedLink } from "@/types/visualizationUi";
import { resolveMatrixValue } from "@/utils/matrixValue";

export const buildNetworkSummaryLabelMap = (options: NetworkOption[]) => {
  return options.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {});
};

export const buildSourceLabelMap = (links: SelectedLink[]) => {
  const map = new Map<string, string>();
  links.forEach((link) => {
    link.sources.forEach((source) => {
      if (!map.has(source.compoundId)) {
        map.set(source.compoundId, source.networkLabel);
      }
    });
  });
  return map;
};

export const resolveNetworkLabel = (
  compoundId: string,
  networkLabelMap: Record<string, string>,
  sourceLabelMap: Map<string, string>,
) => {
  return networkLabelMap[compoundId] ?? sourceLabelMap.get(compoundId) ?? compoundId;
};

export const buildNetworkColumns = (
  selectedNetworkIds: string[],
  networkLabelMap: Record<string, string>,
  sourceLabelMap: Map<string, string>,
): NetworkColumn[] => {
  return selectedNetworkIds.map((compoundId) => ({
    compoundId,
    label: resolveNetworkLabel(compoundId, networkLabelMap, sourceLabelMap),
  }));
};

const buildSourceValueMap = (link: SelectedLink) => {
  return link.sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.compoundId] = source.value;
    return acc;
  }, {});
};

const resolveNetworkValue = (
  sourceValueMap: Record<string, number>,
  compoundId: string,
  link: SelectedLink,
  networkLookup: NetworkLookup,
  atlasIndex: Map<string, number>,
) => {
  if (compoundId in sourceValueMap) {
    return sourceValueMap[compoundId];
  }

  const networkView = networkLookup[compoundId];
  const rowIndex = atlasIndex.get(link.rowId);
  const colIndex = atlasIndex.get(link.colId);
  const value =
    rowIndex !== undefined && colIndex !== undefined && networkView?.data
      ? resolveMatrixValue(networkView.data, rowIndex, colIndex)
      : undefined;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const buildLinkValues = ({
  link,
  networkIds,
  networkLookup,
  atlasIndex,
}: BuildLinkValuesParams): Record<string, number | null> => {
  const sourceValueMap = buildSourceValueMap(link);
  return networkIds.reduce<Record<string, number | null>>((acc, compoundId) => {
    acc[compoundId] = resolveNetworkValue(
      sourceValueMap,
      compoundId,
      link,
      networkLookup,
      atlasIndex,
    );
    return acc;
  }, {});
};

export const buildRows = ({
  links,
  selectedNetworkIds,
  networkLookup,
  atlasIndex,
}: BuildRowsParams): LinkRow[] => {
  return links.map((link) => ({
    key: link.id,
    linkLabel: `${link.rowLabel} ${link.directed ? "→" : "↔"} ${link.colLabel}`,
    values: buildLinkValues({
      link,
      networkIds: selectedNetworkIds,
      networkLookup,
      atlasIndex,
    }),
  }));
};

export const buildExportLinks = (
  links: SelectedLink[],
  networkIds: string[],
  networkLookup: NetworkLookup,
  atlasIndex: Map<string, number>,
): ExportedLink[] => {
  return links.map((link) => ({
    id: link.id,
    rowId: link.rowId,
    rowLabel: link.rowLabel,
    colId: link.colId,
    colLabel: link.colLabel,
    directed: link.directed,
    values: buildLinkValues({
      link,
      networkIds,
      networkLookup,
      atlasIndex,
    }),
  }));
};

export const buildExportPayload = (
  mode: DownloadMode,
  networkIds: string[],
  resolveLabel: (compoundId: string) => string,
  links: ExportedLink[],
): SelectedLinksExportPayload => {
  return {
    exportedAt: new Date().toISOString(),
    mode,
    linksCount: links.length,
    networksCount: networkIds.length,
    networks: networkIds.map((compoundId) => ({
      compoundId,
      label: resolveLabel(compoundId),
    })),
    links,
  };
};

export const downloadExportPayload = (
  payload: SelectedLinksExportPayload,
  mode: DownloadMode,
) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const datePart = new Date().toISOString().slice(0, 10);
  const suffix = mode === "all" ? "all-networks" : "viewer-networks";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `selected-links-${suffix}-${datePart}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
