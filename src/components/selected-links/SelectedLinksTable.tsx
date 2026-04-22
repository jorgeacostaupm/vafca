import { Button, Table, Typography } from "antd";
import { useMemo } from "react";
import type { TableColumnsType } from "antd";
import type {
  LinkRow,
  MatrixColumn,
} from "@/components/selected-links/selectedLinksPanel.types";

type SelectedLinksTableProps = {
  rows: LinkRow[];
  matrixColumns: MatrixColumn[];
  atlasLinkIds: string[];
  onSetAtlasLinkIds: (ids: string[]) => void;
  onToggleAtlasLinkId: (id: string) => void;
  onRemoveSelectedLink: (id: string) => void;
};

export default function SelectedLinksTable({
  rows,
  matrixColumns,
  atlasLinkIds,
  onSetAtlasLinkIds,
  onToggleAtlasLinkId,
  onRemoveSelectedLink,
}: SelectedLinksTableProps) {
  const columns = useMemo<TableColumnsType<LinkRow>>(
    () => [
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
            onClick={() => onRemoveSelectedLink(record.key)}
          >
            Remove
          </Button>
        ),
      },
    ],
    [matrixColumns, onRemoveSelectedLink],
  );

  return (
    <Table
      rowSelection={{
        selectedRowKeys: atlasLinkIds,
        onChange: (keys) => onSetAtlasLinkIds(keys.map((key) => String(key))),
      }}
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
      pagination={false}
      size="small"
      scroll={{ x: "max-content" }}
    />
  );
}

