import { Button, Space, Table, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { type PointerEvent, type ReactNode, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addNetworkViewAndFormat } from "@/store/slices/networkVisualization";
import {
  addSelectedLink,
  removeSelectedLink,
} from "@/store/slices/visualizationUi";
import ResizableContainer from "@/components/layout/ResizableContainer";
import { getMatrixCompoundId } from "@/utils/rankings/rankingMatrixMetadata";
import { useRankingRowInteractions } from "@/components/rankings/useRankingRowInteractions";
import type {
  LinkRankingRow,
  MatrixRankingRow,
  RankingResult,
  RankingRow,
} from "@/types/rankings";

type Props = {
  result: RankingResult;
};

type RankingTableColumn = ColumnsType<RankingRow>[number] & {
  key: string;
  title?: ReactNode;
  width?: number;
};

const formatScore = (value?: number) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(4) : "";

const compareText = (a?: string, b?: string) =>
  (a ?? "").localeCompare(b ?? "", undefined, { sensitivity: "base" });

const compareNumber = (a?: number, b?: number) => (a ?? Number.NaN) - (b ?? Number.NaN);
const TABLE_CHROME_HEIGHT = 104;
const MIN_COLUMN_WIDTH = 72;

const getBandValueClassName = (
  valuesByBand: Record<string, number> | undefined,
  bandId: string,
) => {
  const entries = Object.entries(valuesByBand ?? {}).filter(([, value]) =>
    Number.isFinite(value),
  );
  if (entries.length < 2) return undefined;
  const values = entries.map(([, value]) => value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const value = valuesByBand?.[bandId];
  if (value === max) return "ranking-band-cell ranking-band-cell--max";
  if (value === min) return "ranking-band-cell ranking-band-cell--min";
  return "ranking-band-cell";
};

const getLinkIds = (row: LinkRankingRow) => ({
  direct: `${row.sourceId}::${row.targetId}`,
  reverse: `${row.targetId}::${row.sourceId}`,
});

const formatLinkLabel = (row: LinkRankingRow) =>
  `${row.sourceLabel} ↔ ${row.targetLabel}`;

export default function RankingResultsTable({ result }: Props) {
  const dispatch = useAppDispatch();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 25 });
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [draggedColumnKey, setDraggedColumnKey] = useState<string | null>(null);
  const connectivity = useAppSelector((state) => state.dataset.data?.connectivity);
  const selectedLinks = useAppSelector((state) => state.visualizationUi.selectedLinks);
  const { handleEnter, handleLeave, handleSelect } = useRankingRowInteractions();

  const selectedLinkIds = useMemo(
    () => new Set(selectedLinks.map((link) => link.id)),
    [selectedLinks],
  );

  const createSelectedLink = (row: LinkRankingRow) => {
    const { direct } = getLinkIds(row);
    const sourceMatrix =
      connectivity?.matrixIndex[row.bestMatrixId ?? result.query.matrixId ?? ""];
    return {
      id: direct,
      rowId: row.sourceId,
      colId: row.targetId,
      rowLabel: row.sourceLabel,
      colLabel: row.targetLabel,
      sources: [
        {
          compoundId: sourceMatrix ? getMatrixCompoundId(sourceMatrix) : "",
          matrixLabel: row.bestBandId ?? "Ranking",
          value: row.value ?? row.score,
        },
      ],
    };
  };

  const addLink = (row: LinkRankingRow) => {
    const { direct, reverse } = getLinkIds(row);
    if (selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)) {
      dispatch(removeSelectedLink(selectedLinkIds.has(direct) ? direct : reverse));
      return;
    }
    dispatch(addSelectedLink(createSelectedLink(row)));
  };

  const addRankingLinks = () => {
    result.rows
      .filter((row): row is LinkRankingRow => row.type === "link")
      .forEach((row) => {
        const { direct, reverse } = getLinkIds(row);
        if (selectedLinkIds.has(direct) || selectedLinkIds.has(reverse)) return;
        dispatch(addSelectedLink(createSelectedLink(row)));
      });
  };

  const removeRankingLinks = () => {
    result.rows
      .filter((row): row is LinkRankingRow => row.type === "link")
      .forEach((row) => {
        const { direct, reverse } = getLinkIds(row);
        if (selectedLinkIds.has(direct)) dispatch(removeSelectedLink(direct));
        if (selectedLinkIds.has(reverse)) dispatch(removeSelectedLink(reverse));
      });
  };

  const linkActionsTitle = (
    <Space size={4}>
      <Tooltip title="Add all">
        <Button
          size="small"
          icon={<PlusOutlined />}
          aria-label="Add all ranking links"
          onClick={(event) => {
            event.stopPropagation();
            addRankingLinks();
          }}
        />
      </Tooltip>
      <Tooltip title="Remove all">
        <Button
          size="small"
          icon={<MinusOutlined />}
          aria-label="Remove all ranking links"
          onClick={(event) => {
            event.stopPropagation();
            removeRankingLinks();
          }}
        />
      </Tooltip>
    </Space>
  );

  const openMatrixView = (row: MatrixRankingRow) => {
    const matrix = connectivity?.matrixIndex[row.matrixId];
    if (!matrix) return;
    void dispatch(
      addNetworkViewAndFormat({
        type: "matrix",
        compoundId: getMatrixCompoundId(matrix),
        label: row.label,
        measureId: row.measureId ?? matrix.context.measureId,
        statId: row.statisticId ?? matrix.stat.id,
      }),
    );
  };

  const resizeColumn = (
    columnKey: string,
    startWidth: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const nextWidth = Math.max(
        MIN_COLUMN_WIDTH,
        Math.round(startWidth + moveEvent.clientX - startX),
      );
      setColumnWidths((current) => ({ ...current, [columnKey]: nextWidth }));
    };
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const moveColumn = (sourceKey: string, targetKey: string, keys: string[]) => {
    if (sourceKey === targetKey) return;
    setColumnOrder((current) => {
      const orderedKeys = current.filter((key) => keys.includes(key));
      const baseOrder = [
        ...orderedKeys,
        ...keys.filter((key) => !orderedKeys.includes(key)),
      ];
      const sourceIndex = baseOrder.indexOf(sourceKey);
      const targetIndex = baseOrder.indexOf(targetKey);
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const nextOrder = [...baseOrder];
      const [moved] = nextOrder.splice(sourceIndex, 1);
      nextOrder.splice(targetIndex, 0, moved);
      return nextOrder;
    });
  };

  const baseColumns = useMemo<RankingTableColumn[]>(() => {
    const common: RankingTableColumn[] = [
      {
        key: "rank",
        title: "Rank",
        dataIndex: "rank",
        width: 72,
        sorter: (a, b) => a.rank - b.rank,
      },
    ];

    if (result.query.target === "matrices") {
      return [
        ...common,
        {
          key: "matrix",
          title: "Matrix",
          dataIndex: "label",
          width: 220,
          ellipsis: true,
          sorter: (a, b) =>
            compareText(
              a.type === "matrix" ? a.label : undefined,
              b.type === "matrix" ? b.label : undefined,
            ),
        },
        {
          key: "source",
          title: "Source",
          dataIndex: "sourceId",
          width: 160,
          ellipsis: true,
          sorter: (a, b) =>
            compareText(
              a.type === "matrix" ? a.sourceId : undefined,
              b.type === "matrix" ? b.sourceId : undefined,
            ),
        },
        {
          key: "measure",
          title: "Measure",
          dataIndex: "measureId",
          width: 110,
          sorter: (a, b) =>
            compareText(
              a.type === "matrix" ? a.measureId : undefined,
              b.type === "matrix" ? b.measureId : undefined,
            ),
        },
        {
          key: "statistic",
          title: "Statistic",
          dataIndex: "statisticId",
          width: 110,
          sorter: (a, b) =>
            compareText(
              a.type === "matrix" ? a.statisticId : undefined,
              b.type === "matrix" ? b.statisticId : undefined,
            ),
        },
        {
          key: "band",
          title: "Band",
          dataIndex: "bandId",
          width: 110,
          sorter: (a, b) =>
            compareText(
              a.type === "matrix" ? a.bandId : undefined,
              b.type === "matrix" ? b.bandId : undefined,
            ),
        },
        {
          key: "score",
          title: "Score",
          dataIndex: "score",
          width: 110,
          render: formatScore,
          sorter: (a, b) => compareNumber(a.score, b.score),
        },
        {
          key: "nLinksUsed",
          title: "N links used",
          dataIndex: "nLinksUsed",
          width: 120,
          sorter: (a, b) =>
            compareNumber(
              a.type === "matrix" ? a.nLinksUsed : undefined,
              b.type === "matrix" ? b.nLinksUsed : undefined,
            ),
        },
        {
          key: "actions",
          title: "",
          width: 90,
          render: (_: unknown, row: RankingRow) =>
            row.type === "matrix" ? (
            <Button
              size="small"
              icon={<EyeOutlined />}
              aria-label="Open as Matrix View"
              onClick={(event) => {
                event.stopPropagation();
                openMatrixView(row);
              }}
            />
            ) : null,
        },
      ];
    }

    if (result.query.target === "links") {
      const isAggregatedLinkRanking = result.query.linkCollectionMode !== "expanded";
      const isOneRowPerBand = result.query.linkCollectionMode === "expanded";
      const bandIds = Array.from(
        new Set(
          result.rows.flatMap((row) =>
            row.type === "link" ? Object.keys(row.valuesByBand ?? {}) : [],
          ),
        ),
      ).sort();
      const hasValue = result.rows.some(
        (row) => row.type === "link" && typeof row.value === "number",
      );
      const hasBestBand = result.rows.some(
        (row) => row.type === "link" && Boolean(row.bestBandId),
      );
      const hasMultipleMatrices = result.rows.some(
        (row) =>
          row.type === "link" &&
          typeof row.nMatricesUsed === "number" &&
          row.nMatricesUsed > 1,
      );
      return [
        ...common,
        {
          key: "link",
          title: "Link",
          width: 240,
          ellipsis: true,
          sorter: (a, b) =>
            compareText(
              a.type === "link" ? formatLinkLabel(a) : undefined,
              b.type === "link" ? formatLinkLabel(b) : undefined,
            ),
          render: (_: unknown, row: RankingRow) =>
            row.type === "link" ? formatLinkLabel(row) : "",
        },
        ...(!isOneRowPerBand
          ? [
              {
                key: "score",
                title: "Score",
                dataIndex: "score",
                width: 110,
                render: formatScore,
                sorter: (a: RankingRow, b: RankingRow) =>
                  compareNumber(a.score, b.score),
              },
            ]
          : []),
        ...(hasValue
          ? [
              {
                key: "value",
                title: "Value",
                dataIndex: "value",
                width: 110,
                render: formatScore,
                sorter: (a: RankingRow, b: RankingRow) =>
                  compareNumber(
                    a.type === "link" ? a.value : undefined,
                    b.type === "link" ? b.value : undefined,
                  ),
              },
            ]
          : []),
        ...(isAggregatedLinkRanking
          ? bandIds.map((bandId) => ({
              key: `band-${bandId}`,
              title: connectivity?.catalogs.bands[bandId]?.label ?? bandId,
              width: 110,
              sorter: (a: RankingRow, b: RankingRow) =>
                compareNumber(
                  a.type === "link" ? a.valuesByBand?.[bandId] : undefined,
                  b.type === "link" ? b.valuesByBand?.[bandId] : undefined,
                ),
              render: (_: unknown, row: RankingRow) => {
                if (row.type !== "link") return "";
                const value = row.valuesByBand?.[bandId];
                return (
                  <span className={getBandValueClassName(row.valuesByBand, bandId)}>
                    {formatScore(value)}
                  </span>
                );
              },
            }))
          : []),
        ...(!isAggregatedLinkRanking && hasBestBand
          ? [
              {
                key: "band",
                title: "Band",
                dataIndex: "bestBandId",
                width: 110,
                sorter: (a: RankingRow, b: RankingRow) =>
                  compareText(
                    a.type === "link" ? a.bestBandId : undefined,
                    b.type === "link" ? b.bestBandId : undefined,
                  ),
              },
            ]
          : []),
        ...(!isAggregatedLinkRanking && hasMultipleMatrices
          ? [
              {
                key: "nMatricesUsed",
                title: "N matrices",
                dataIndex: "nMatricesUsed",
                width: 110,
                sorter: (a: RankingRow, b: RankingRow) =>
                  compareNumber(
                    a.type === "link" ? a.nMatricesUsed : undefined,
                    b.type === "link" ? b.nMatricesUsed : undefined,
                  ),
              },
            ]
          : []),
        {
          key: "actions",
          title: linkActionsTitle,
          width: 110,
          render: (_: unknown, row: RankingRow) => {
            if (row.type !== "link") return null;
            const { direct, reverse } = getLinkIds(row);
            const exists = selectedLinkIds.has(direct) || selectedLinkIds.has(reverse);
            return (
              <Button
                size="small"
                icon={exists ? <MinusOutlined /> : <PlusOutlined />}
                aria-label={exists ? "Remove link" : "Add link"}
                onClick={(event) => {
                  event.stopPropagation();
                  addLink(row);
                }}
              />
            );
          },
        },
      ];
    }

    return [
      ...common,
      {
        key: "roi",
        title: "ROI",
        dataIndex: "label",
        width: 180,
        ellipsis: true,
        sorter: (a, b) =>
          compareText(
            a.type === "roi" ? a.label : undefined,
            b.type === "roi" ? b.label : undefined,
          ),
      },
      {
        key: "group",
        title: "Group",
        dataIndex: "group",
        width: 140,
        sorter: (a, b) =>
          compareText(
            a.type === "roi" ? a.group : undefined,
            b.type === "roi" ? b.group : undefined,
          ),
      },
      {
        key: "score",
        title: "Score",
        dataIndex: "score",
        width: 110,
        render: formatScore,
        sorter: (a, b) => compareNumber(a.score, b.score),
      },
      {
        key: "nIncidentLinks",
        title: "N incident links",
        dataIndex: "nIncidentLinks",
        width: 140,
        sorter: (a, b) =>
          compareNumber(
            a.type === "roi" ? a.nIncidentLinks : undefined,
            b.type === "roi" ? b.nIncidentLinks : undefined,
          ),
      },
      {
        key: "maxValue",
        title: "Max value",
        dataIndex: "maxValue",
        width: 110,
        render: formatScore,
        sorter: (a, b) =>
          compareNumber(
            a.type === "roi" ? a.maxValue : undefined,
            b.type === "roi" ? b.maxValue : undefined,
          ),
      },
      {
        key: "meanValue",
        title: "Mean value",
        dataIndex: "meanValue",
        width: 110,
        render: formatScore,
        sorter: (a, b) =>
          compareNumber(
            a.type === "roi" ? a.meanValue : undefined,
            b.type === "roi" ? b.meanValue : undefined,
          ),
      },
    ];
  }, [connectivity, result.query, result.rows, selectedLinkIds]);

  const columns = useMemo<ColumnsType<RankingRow>>(() => {
    const keys = baseColumns.map((column) => column.key);
    const orderedKeys = [
      ...columnOrder.filter((key) => keys.includes(key)),
      ...keys.filter((key) => !columnOrder.includes(key)),
    ];
    const columnByKey = new Map(baseColumns.map((column) => [column.key, column]));

    return orderedKeys.flatMap((key) => {
      const column = columnByKey.get(key);
      if (!column) return [];
      const width = columnWidths[key] ?? column.width ?? 120;

      return [
        {
          ...column,
          align: column.align ?? "center",
          width,
          title: (
            <span
              className={[
                "ranking-column-header",
                draggedColumnKey === key ? "ranking-column-header--dragging" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (draggedColumnKey) moveColumn(draggedColumnKey, key, keys);
                setDraggedColumnKey(null);
              }}
            >
              <span
                className="ranking-column-header__label"
                draggable
                onDragStart={(event) => {
                  event.stopPropagation();
                  setDraggedColumnKey(key);
                }}
                onDragEnd={() => setDraggedColumnKey(null)}
              >
                {column.title}
              </span>
              <button
                type="button"
                className="ranking-column-header__resize"
                aria-label={`Resize ${String(column.title ?? "column")}`}
                draggable={false}
                onDragStart={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onPointerDown={(event) => resizeColumn(key, width, event)}
              >
                <span className="ranking-column-header__resize-mark" />
              </button>
            </span>
          ),
        },
      ];
    });
  }, [baseColumns, columnOrder, columnWidths, draggedColumnKey]);

  const tableScrollX = useMemo(
    () =>
      columns.reduce((total, column) => {
        const width = typeof column.width === "number" ? column.width : 120;
        return total + width;
      }, 0),
    [columns],
  );

  return (
    <div className="ranking-result">
      <ResizableContainer>
        {({ height }) => (
          <Table<RankingRow>
            size="small"
            rowKey={(row) =>
              row.type === "matrix"
                ? row.matrixId
                : row.type === "roi"
                  ? row.roiId
                  : `${row.sourceId}::${row.targetId}::${row.bestMatrixId ?? "all"}`
            }
            columns={columns}
            className="ranking-result__table"
            dataSource={result.rows}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              showSizeChanger: true,
              pageSizeOptions: [10, 25, 50, 100],
            }}
            scroll={{
              x: Math.max(900, tableScrollX),
              y: Math.max(180, height - TABLE_CHROME_HEIGHT),
            }}
            onChange={(nextPagination) => {
              setPagination({
                current: nextPagination.current ?? 1,
                pageSize: nextPagination.pageSize ?? pagination.pageSize,
              });
            }}
            onRow={(row) => ({
              onMouseEnter: () => handleEnter(row),
              onMouseLeave: handleLeave,
              onClick: () => handleSelect(row),
            })}
          />
        )}
      </ResizableContainer>
    </div>
  );
}
