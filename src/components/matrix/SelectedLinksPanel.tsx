import {
  Button,
  Dropdown,
  Select,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSelectedLinks,
  removeSelectedLink,
  setAtlasLinkIds,
  toggleAtlasLinkId,
} from "@/store/slices/visualizationUiSlice";
import SelectedLinksAtlas from "@/components/matrix/SelectedLinksAtlas";
import { useMatrixSummaries } from "@/hooks/useMatrixSummaries";
import { getMatrix } from "@/utils/matrixStore";
import type { ConnectivityMatrix } from "@/types/matrix";
import { resolveMatrixValue } from "@/utils/matrixValue";
import { buildMatrixLabel } from "@/utils/matrixViewUtils";

type MatrixOption = {
  value: string;
  label: string;
};

type MatrixColumn = {
  compoundId: string;
  label: string;
};

type LinkRow = {
  key: string;
  linkLabel: string;
  values: Record<string, number | null>;
};

type DownloadMode = "all" | "viewer";

export default function SelectedLinksPanel() {
  const dispatch = useAppDispatch();
  const links = useAppSelector((state) => state.visualizationUi.selectedLinks);
  const atlasLinkIds = useAppSelector(
    (state) => state.visualizationUi.atlasLinkIds,
  );
  const matrixShape = useAppSelector(
    (state) => state.visualizationUi.matrixShape,
  );
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlasOrder = useAppSelector((state) => state.atlas.order);
  const { summaries, status } = useMatrixSummaries(dataset?.matrixStats.total);
  const [selectedMatrixIds, setSelectedMatrixIds] = useState<string[]>([]);
  const [matrixCache, setMatrixCache] = useState<
    Record<string, ConnectivityMatrix | null>
  >({});
  const [loadingMatrices, setLoadingMatrices] = useState(false);
  const [downloadingMode, setDownloadingMode] = useState<DownloadMode | null>(
    null,
  );
  const dismissedMatrixIdsRef = useRef<Set<string>>(new Set());
  const matrixOptions = useMemo<MatrixOption[]>(() => {
    return summaries
      .map((summary) => ({
        value: summary.compoundId,
        label: buildMatrixLabel(summary, dataset?.catalogs),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [summaries, dataset]);

  useEffect(() => {
    if (links.length === 0) return;
    setSelectedMatrixIds((prev) => {
      const seen = new Set(prev);
      const additions: string[] = [];
      links.forEach((link) => {
        link.sources.forEach((source) => {
          if (!seen.has(source.compoundId)) {
            if (dismissedMatrixIdsRef.current.has(source.compoundId)) {
              return;
            }
            seen.add(source.compoundId);
            additions.push(source.compoundId);
          }
        });
      });
      if (additions.length === 0) return prev;
      return [...prev, ...additions];
    });
  }, [links]);

  useEffect(() => {
    if (atlasLinkIds.length === 0) return;
    const linkIds = new Set(links.map((link) => link.id));
    const filtered = atlasLinkIds.filter((id) => linkIds.has(id));
    if (filtered.length === atlasLinkIds.length) return;
    dispatch(setAtlasLinkIds(filtered));
  }, [atlasLinkIds, dispatch, links]);

  useEffect(() => {
    let active = true;
    const missing = selectedMatrixIds.filter((id) => !(id in matrixCache));
    if (missing.length === 0) return;
    setLoadingMatrices(true);
    Promise.all(
      missing.map(async (compoundId) => {
        try {
          const matrix = await getMatrix(compoundId);
          return [compoundId, matrix ?? null] as const;
        } catch {
          return [compoundId, null] as const;
        }
      }),
    )
      .then((entries) => {
        if (!active) return;
        setMatrixCache((prev) => {
          const next = { ...prev };
          for (const [id, matrix] of entries) {
            next[id] = matrix;
          }
          return next;
        });
      })
      .finally(() => {
        if (active) setLoadingMatrices(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMatrixIds, matrixCache]);

  const matrixLabelMap = useMemo(() => {
    return matrixOptions.reduce<Record<string, string>>((acc, option) => {
      acc[option.value] = option.label;
      return acc;
    }, {});
  }, [matrixOptions]);

  const sourceLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    links.forEach((link) => {
      link.sources.forEach((source) => {
        if (!map.has(source.compoundId)) {
          map.set(source.compoundId, source.matrixLabel);
        }
      });
    });
    return map;
  }, [links]);

  const atlasIndex = useMemo(() => {
    return new Map(atlasOrder.map((id, index) => [id, index]));
  }, [atlasOrder]);

  const matrixColumns = useMemo<MatrixColumn[]>(() => {
    return selectedMatrixIds.map((compoundId) => ({
      compoundId,
      label:
        matrixLabelMap[compoundId] ??
        sourceLabelMap.get(compoundId) ??
        compoundId,
    }));
  }, [matrixLabelMap, selectedMatrixIds, sourceLabelMap]);

  const allMatrixIds = useMemo(
    () => matrixOptions.map((option) => option.value),
    [matrixOptions],
  );

  const resolveLayerLabel = (compoundId: string) =>
    matrixLabelMap[compoundId] ?? sourceLabelMap.get(compoundId) ?? compoundId;

  const rows = useMemo<LinkRow[]>(() => {
    return links.map((link) => {
      const values: Record<string, number | null> = {};
      link.sources.forEach((source) => {
        values[source.compoundId] = source.value;
      });

      selectedMatrixIds.forEach((compoundId) => {
        if (compoundId in values) return;
        const matrix = matrixCache[compoundId];
        const rowIndex = atlasIndex.get(link.rowId);
        const colIndex = atlasIndex.get(link.colId);
        const value =
          rowIndex !== undefined && colIndex !== undefined
            ? matrix?.data
              ? resolveMatrixValue(matrix.data, rowIndex, colIndex, matrixShape)
              : undefined
            : undefined;
        values[compoundId] = Number.isFinite(value) ? (value as number) : null;
      });

      return {
        key: link.id,
        linkLabel: `${link.rowLabel} ↔ ${link.colLabel}`,
        values,
      };
    });
  }, [links, selectedMatrixIds, matrixCache, atlasIndex, matrixShape]);

  const downloadLinks = async (mode: DownloadMode) => {
    const selectedIdSet = new Set(atlasLinkIds);
    const linksToDownload =
      selectedIdSet.size > 0
        ? links.filter((link) => selectedIdSet.has(link.id))
        : links;
    if (linksToDownload.length === 0) {
      message.warning("No links available to download.");
      return;
    }

    const layerIds =
      mode === "all"
        ? allMatrixIds
        : selectedMatrixIds.filter((id) => allMatrixIds.includes(id));
    if (layerIds.length === 0) {
      message.warning("No layers selected for download.");
      return;
    }

    setDownloadingMode(mode);
    try {
      const missing = layerIds.filter((id) => !(id in matrixCache));
      const fetchedEntries = await Promise.all(
        missing.map(async (compoundId) => {
          try {
            const matrix = await getMatrix(compoundId);
            return [compoundId, matrix ?? null] as const;
          } catch {
            return [compoundId, null] as const;
          }
        }),
      );

      const fetchedMap = fetchedEntries.reduce<
        Record<string, ConnectivityMatrix | null>
      >((acc, [id, matrix]) => {
        acc[id] = matrix;
        return acc;
      }, {});
      const nextMatrixCache = { ...matrixCache, ...fetchedMap };
      if (fetchedEntries.length > 0) {
        setMatrixCache((prev) => ({ ...prev, ...fetchedMap }));
      }

      const exportLinks = linksToDownload.map((link) => {
        const rowIndex = atlasIndex.get(link.rowId);
        const colIndex = atlasIndex.get(link.colId);
        const sourceValueMap = link.sources.reduce<Record<string, number>>(
          (acc, source) => {
            acc[source.compoundId] = source.value;
            return acc;
          },
          {},
        );
        const values = layerIds.reduce<Record<string, number | null>>(
          (acc, compoundId) => {
            if (compoundId in sourceValueMap) {
              acc[compoundId] = sourceValueMap[compoundId];
              return acc;
            }
            const matrix = nextMatrixCache[compoundId];
            const value =
              rowIndex !== undefined && colIndex !== undefined
                ? matrix?.data
                  ? resolveMatrixValue(
                      matrix.data,
                      rowIndex,
                      colIndex,
                      matrixShape,
                    )
                  : undefined
                : undefined;
            acc[compoundId] = Number.isFinite(value) ? (value as number) : null;
            return acc;
          },
          {},
        );
        return {
          id: link.id,
          rowId: link.rowId,
          rowLabel: link.rowLabel,
          colId: link.colId,
          colLabel: link.colLabel,
          values,
        };
      });

      const payload = {
        exportedAt: new Date().toISOString(),
        mode,
        matrixShape,
        linksCount: exportLinks.length,
        layersCount: layerIds.length,
        layers: layerIds.map((compoundId) => ({
          compoundId,
          label: resolveLayerLabel(compoundId),
        })),
        links: exportLinks,
      };
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
      message.success(
        `Downloaded ${exportLinks.length} link${
          exportLinks.length === 1 ? "" : "s"
        } with ${layerIds.length} layer${layerIds.length === 1 ? "" : "s"}.`,
      );
    } finally {
      setDownloadingMode(null);
    }
  };

  return (
    <div className="links-panel">
      <div className="links-panel__table">
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Typography.Title level={4} style={{ margin: 0 }}>
              Selected links
            </Typography.Title>
            <Space size={8}>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "all",
                      label: "Download all available matrices",
                    },
                    {
                      key: "viewer",
                      label: "Download selected matrices",
                    },
                  ],
                  onClick: ({ key }) => {
                    void downloadLinks(key as DownloadMode);
                  },
                }}
                trigger={["click"]}
              >
                <Button
                  disabled={links.length === 0}
                  loading={downloadingMode !== null}
                >
                  Download links
                </Button>
              </Dropdown>
              <Button
                onClick={() => dispatch(clearSelectedLinks())}
                disabled={links.length === 0}
              >
                Clear
              </Button>
            </Space>
          </Space>
          <Typography.Text type="secondary">
            Select links in the table to highlight them in the atlas.
          </Typography.Text>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <Typography.Text strong>Additional matrices</Typography.Text>
            <Select
              mode="multiple"
              allowClear
              options={matrixOptions}
              optionFilterProp="label"
              placeholder="Select matrices to show extra values"
              value={selectedMatrixIds}
              loading={status === "loading"}
              style={{ width: "100%" }}
              onChange={(value) => {
                setSelectedMatrixIds((prev) => {
                  const next = value;
                  const nextSet = new Set(next);
                  const removed = prev.filter((id) => !nextSet.has(id));
                  const added = next.filter((id) => !prev.includes(id));
                  removed.forEach((id) =>
                    dismissedMatrixIdsRef.current.add(id),
                  );
                  added.forEach((id) =>
                    dismissedMatrixIdsRef.current.delete(id),
                  );
                  return next;
                });
              }}
            />
            {selectedMatrixIds.length > 0 && loadingMatrices ? (
              <Typography.Text type="secondary">
                Loading matrix values…
              </Typography.Text>
            ) : null}
          </Space>
          <Table
            rowSelection={{
              selectedRowKeys: atlasLinkIds,
              onChange: (keys) => dispatch(setAtlasLinkIds(keys as string[])),
            }}
            onRow={(record) => ({
              onClick: (event) => {
                const target = event.target as HTMLElement | null;
                if (
                  target?.closest(
                    "button, a, input, .ant-select, .ant-dropdown",
                  )
                ) {
                  return;
                }
                dispatch(toggleAtlasLinkId(record.key));
              },
            })}
            columns={[
              {
                title: "Link",
                dataIndex: "linkLabel",
                key: "link",
                fixed: "left",
              },
              ...matrixColumns.map((column) => ({
                title: column.label,
                dataIndex: ["values", column.compoundId],
                key: column.compoundId,
                align: "center" as const,
                sorter: (a: LinkRow, b: LinkRow) => {
                  const va = a.values[column.compoundId];
                  const vb = b.values[column.compoundId];
                  if (va === null && vb === null) return 0;
                  if (va === null) return 1;
                  if (vb === null) return -1;
                  return va - vb;
                },
                render: (value: number | null) =>
                  value === null ? (
                    <Typography.Text type="secondary">n/a</Typography.Text>
                  ) : (
                    <Typography.Text strong>{value.toFixed(4)}</Typography.Text>
                  ),
              })),
              {
                title: "",
                key: "actions",
                fixed: "right",
                render: (_: unknown, record: LinkRow) => (
                  <Button
                    size="small"
                    type="text"
                    onClick={() => dispatch(removeSelectedLink(record.key))}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
            dataSource={rows}
            locale={{ emptyText: "No links selected yet." }}
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
          />
        </Space>
      </div>
      <div className="links-panel__atlas">
        <SelectedLinksAtlas />
      </div>
    </div>
  );
}
