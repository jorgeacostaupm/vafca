import { DeleteOutlined, SwapOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Table, Typography } from "antd";
import { type CSSProperties, useMemo } from "react";

import type {
  LinkRow,
  NetworkColumn,
} from "@/components/selected-links/selectedLinksPanel.types";
import {
  SELECTED_LINKS_TABLE_DEFAULT_PAGE_SIZE,
  SELECTED_LINKS_TABLE_PAGE_SIZE_OPTIONS,
} from "@/config/ui";
import { useAtlasLabelPresentation } from "@/hooks/useAtlasLabelPresentation";

type SelectedLinksTableProps = {
  rows: LinkRow[];
  networkColumns: NetworkColumn[];
  atlasLinkIds: string[];
  onSetAtlasLinkIds: (ids: string[]) => void;
  onToggleAtlasLinkId: (id: string) => void;
  onRemoveSelectedLink: (id: string) => void;
};

export default function SelectedLinksTable({
  rows,
  networkColumns,
  atlasLinkIds,
  onSetAtlasLinkIds,
  onToggleAtlasLinkId,
  onRemoveSelectedLink,
}: SelectedLinksTableProps) {
  const { nodeColors } = useAtlasLabelPresentation();
  const atlasLinkIdSet = useMemo(() => new Set(atlasLinkIds), [atlasLinkIds]);
  const columns = useMemo<TableColumnsType<LinkRow>>(
    () => [
      {
        title: "Link",
        dataIndex: "linkLabel",
        key: "link",
        fixed: "left",
        width: 280,
        render: (_: string, record) => (
          <div className="selected-links-table__link" title={record.linkLabel}>
            <span className="selected-links-table__node" style={{
              '--selected-link-node-color': nodeColors[record.rowId],
            } as CSSProperties}>{record.rowLabel}</span>
            <span className="selected-links-table__direction" aria-hidden="true">
              <SwapOutlined />
            </span>
            <span className="selected-links-table__node" style={{
              '--selected-link-node-color': nodeColors[record.colId],
            } as CSSProperties}>{record.colLabel}</span>
          </div>
        ),
      },
      ...networkColumns.map((column) => ({
        title: column.label,
        dataIndex: ["values", column.compoundId],
        key: column.compoundId,
        align: "center" as const,
        width: 140,
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
            <Typography.Text className="selected-links-table__empty-value">
              n/a
            </Typography.Text>
          ) : (
            <span className="selected-links-table__value">
              {value.toFixed(4)}
            </span>
          ),
      })),
      {
        title: "",
        key: "actions",
        fixed: "right",
        width: 52,
        render: (_: unknown, record: LinkRow) => (
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label="Remove selected link"
            onClick={() => onRemoveSelectedLink(record.key)}
          />
        ),
      },
    ],
    [networkColumns, onRemoveSelectedLink, nodeColors],
  );

  return (
    <Table
      className="selected-links-table"
      rowSelection={{
        selectedRowKeys: atlasLinkIds,
        onChange: (keys) => onSetAtlasLinkIds(keys.map((key) => String(key))),
      }}
      rowClassName={(record) =>
        atlasLinkIdSet.has(record.key) ? "selected-links-table__row--active" : ""
      }
      onRow={(record) => ({
        onClick: (event) => {
          const target = event.target as HTMLElement | null;
          if (
            target?.closest("button, a, input, .ant-select, .ant-dropdown")
          ) {
            return;
          }
          onToggleAtlasLinkId(record.key);
        },
      })}
      columns={columns}
      dataSource={rows}
      locale={{ emptyText: "No links selected yet." }}
      pagination={
        rows.length > SELECTED_LINKS_TABLE_DEFAULT_PAGE_SIZE
          ? {
              defaultPageSize: SELECTED_LINKS_TABLE_DEFAULT_PAGE_SIZE,
              pageSizeOptions: SELECTED_LINKS_TABLE_PAGE_SIZE_OPTIONS,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} ${total === 1 ? "link" : "links"}`,
            }
          : false
      }
      size="small"
      scroll={{ x: "max-content" }}
    />
  );
}
