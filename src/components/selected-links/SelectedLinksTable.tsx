import { DeleteOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Table, Typography } from "antd";
import { useMemo } from "react";

import type {
  LinkRow,
  NetworkColumn,
} from "@/components/selected-links/selectedLinksPanel.types";

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
  const columns = useMemo<TableColumnsType<LinkRow>>(
    () => [
      {
        title: "Link",
        dataIndex: "linkLabel",
        key: "link",
        fixed: "left",
      },
      ...networkColumns.map((column) => ({
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
            danger
            icon={<DeleteOutlined />}
            aria-label="Remove selected link"
            onClick={() => onRemoveSelectedLink(record.key)}
          />
        ),
      },
    ],
    [networkColumns, onRemoveSelectedLink],
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
