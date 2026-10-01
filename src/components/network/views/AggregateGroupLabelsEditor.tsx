import { Input, Table, Typography } from 'antd'

import type { NodeGroup } from '@/types/network'

export default function AggregateGroupLabelsEditor({ groups, labels, disabled = false, onChange }: {
  groups: NodeGroup[]
  labels: Record<string, string>
  disabled?: boolean
  onChange: (id: string, label: string) => void
}) {
  return <>
      <Typography.Paragraph type="secondary">
        Edit the short labels shown in the chart. Empty labels use G1, G2, etc.
        Long labels are shortened with …; hover a node to see its full label and group name.
      </Typography.Paragraph>
      <Table className="network-aggregation-groups" dataSource={groups} rowKey="id" size="small"
        pagination={false} tableLayout="fixed" columns={[
          { title: 'Short label', key: 'label', render: (_, group, index) => (
            <Input aria-label={`Short label for ${group.label}`} disabled={disabled}
              value={labels[group.id] ?? `G${index + 1}`} placeholder={`G${index + 1}`}
              onChange={event => onChange(group.id, event.target.value)} />
          ) },
          { title: 'Full group name', dataIndex: 'label', key: 'name', render: (name: string) => (
            <span className="network-aggregation-groups__name">{name}</span>
          ) },
          { title: 'ROIs', key: 'count', render: (_, group) => group.nodeIds.length },
        ]} />
  </>
}
