import { resolveMatrixValue } from "@/utils/matrixValue";
import type { SelectedLink } from "@/types/visualizationUi";
import type {
  BuildLinkValuesParams,
  BuildRowsParams,
  DownloadMode,
  ExportedLink,
  LinkRow,
  MatrixCache,
  MatrixColumn,
  MatrixOption,
  SelectedLinksExportPayload,
} from "@/components/selected-links/selectedLinksPanel.types";

export const buildMatrixLabelMap = (options: MatrixOption[]) => {
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
        map.set(source.compoundId, source.matrixLabel);
      }
    });
  });
  return map;
};

export const resolveLayerLabel = (
  compoundId: string,
  matrixLabelMap: Record<string, string>,
  sourceLabelMap: Map<string, string>,
) => {
  return matrixLabelMap[compoundId] ?? sourceLabelMap.get(compoundId) ?? compoundId;
};

export const buildMatrixColumns = (
  selectedMatrixIds: string[],
  matrixLabelMap: Record<string, string>,
  sourceLabelMap: Map<string, string>,
): MatrixColumn[] => {
  return selectedMatrixIds.map((compoundId) => ({
    compoundId,
    label: resolveLayerLabel(compoundId, matrixLabelMap, sourceLabelMap),
  }));
};

const buildSourceValueMap = (link: SelectedLink) => {
  return link.sources.reduce<Record<string, number>>((acc, source) => {
    acc[source.compoundId] = source.value;
    return acc;
  }, {});
};

const resolveLayerValue = (
  sourceValueMap: Record<string, number>,
  compoundId: string,
  link: SelectedLink,
  matrixCache: MatrixCache,
  atlasIndex: Map<string, number>,
  matrixShape: BuildLinkValuesParams["matrixShape"],
) => {
  if (compoundId in sourceValueMap) {
    return sourceValueMap[compoundId];
  }

  const matrix = matrixCache[compoundId];
  const rowIndex = atlasIndex.get(link.rowId);
  const colIndex = atlasIndex.get(link.colId);
  const value =
    rowIndex !== undefined && colIndex !== undefined && matrix?.data
      ? resolveMatrixValue(matrix.data, rowIndex, colIndex, matrixShape)
      : undefined;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export const buildLinkValues = ({
  link,
  layerIds,
  matrixCache,
  atlasIndex,
  matrixShape,
}: BuildLinkValuesParams): Record<string, number | null> => {
  const sourceValueMap = buildSourceValueMap(link);
  return layerIds.reduce<Record<string, number | null>>((acc, compoundId) => {
    acc[compoundId] = resolveLayerValue(
      sourceValueMap,
      compoundId,
      link,
      matrixCache,
      atlasIndex,
      matrixShape,
    );
    return acc;
  }, {});
};

export const buildRows = ({
  links,
  selectedMatrixIds,
  matrixCache,
  atlasIndex,
  matrixShape,
}: BuildRowsParams): LinkRow[] => {
  return links.map((link) => ({
    key: link.id,
    linkLabel: `${link.rowLabel} ↔ ${link.colLabel}`,
    values: buildLinkValues({
      link,
      layerIds: selectedMatrixIds,
      matrixCache,
      atlasIndex,
      matrixShape,
    }),
  }));
};

export const buildExportLinks = (
  links: SelectedLink[],
  layerIds: string[],
  matrixCache: MatrixCache,
  atlasIndex: Map<string, number>,
  matrixShape: BuildLinkValuesParams["matrixShape"],
): ExportedLink[] => {
  return links.map((link) => ({
    id: link.id,
    rowId: link.rowId,
    rowLabel: link.rowLabel,
    colId: link.colId,
    colLabel: link.colLabel,
    values: buildLinkValues({
      link,
      layerIds,
      matrixCache,
      atlasIndex,
      matrixShape,
    }),
  }));
};

export const buildExportPayload = (
  mode: DownloadMode,
  matrixShape: BuildLinkValuesParams["matrixShape"],
  layerIds: string[],
  resolveLabel: (compoundId: string) => string,
  links: ExportedLink[],
): SelectedLinksExportPayload => {
  return {
    exportedAt: new Date().toISOString(),
    mode,
    matrixShape,
    linksCount: links.length,
    layersCount: layerIds.length,
    layers: layerIds.map((compoundId) => ({
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
  const suffix = mode === "all" ? "all-layers" : "viewer-layers";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `selected-links-${suffix}-${datePart}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

