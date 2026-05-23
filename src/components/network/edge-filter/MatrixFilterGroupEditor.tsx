import { Button, Card, Select, Space, Tooltip, Typography } from "antd";
import {
  createDraftMatrixFilterRule,
  createEmptyMatrixFilterGroup,
  MAX_MATRIX_FILTER_DEPTH,
} from "@/utils/edgeFilter";
import type { Catalogs, MatrixRecord } from "@/types/connectivityBundle";
import type {
  LogicalOperator,
  MatrixFilterExpression,
  MatrixFilterGroup,
} from "@/types/edgeFilter";
import MatrixFilterRuleEditor from "./MatrixFilterRuleEditor";

type MatrixOptionGroup = {
  label: string;
  options: { value: string; label: string; searchText: string }[];
};

type Props = {
  group: MatrixFilterGroup;
  isRoot?: boolean;
  depth?: number;
  matrices: MatrixRecord[];
  matrixGroups: MatrixOptionGroup[];
  catalogs?: Catalogs;
  uiRangeMode: "logical_default" | "observed";
  onChange: (group: MatrixFilterGroup) => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

const operatorOptions: { value: LogicalOperator; label: string }[] = [
  { value: "AND", label: "AND" },
  { value: "OR", label: "OR" },
];

const moveItem = <T,>(items: T[], index: number, delta: -1 | 1) => {
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
};

export default function MatrixFilterGroupEditor({
  group,
  isRoot = false,
  depth = 1,
  matrices,
  matrixGroups,
  catalogs,
  uiRangeMode,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  const setChildren = (children: MatrixFilterExpression[]) =>
    onChange({ ...group, children });

  const addChild = (child: MatrixFilterExpression) => {
    setChildren([
      ...group.children,
      group.children.length === 0 ? child : { ...child, joinOperator: "AND" },
    ]);
  };

  const updateChild = (index: number, child: MatrixFilterExpression) => {
    const children = [...group.children];
    children[index] = child;
    setChildren(children);
  };

  const canAddGroup = depth < MAX_MATRIX_FILTER_DEPTH;

  return (
    <Card
      size="small"
      className="edge-filter-group"
      title={isRoot ? "Root group" : `Group level ${depth}`}
      extra={
        <Space wrap>
          {onMoveUp ? <a onClick={onMoveUp}>Move up</a> : null}
          {onMoveDown ? <a onClick={onMoveDown}>Move down</a> : null}
          {!isRoot && onDelete ? <a onClick={onDelete}>Delete group</a> : null}
        </Space>
      }
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Space wrap>
          <Button
            onClick={() =>
              addChild(createDraftMatrixFilterRule(matrices[0]))
            }
          >
            + Add rule
          </Button>
          <Tooltip title={canAddGroup ? undefined : "Maximum group depth reached"}>
            <Button
              disabled={!canAddGroup}
              onClick={() => addChild(createEmptyMatrixFilterGroup("AND"))}
            >
              + Add group
            </Button>
          </Tooltip>
        </Space>

        {group.children.length === 0 ? (
          <Typography.Text type="secondary">Add a rule or group to build a valid filter.</Typography.Text>
        ) : null}

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {group.children.map((child, index) => (
            <Space key={child.id} direction="vertical" size={8} style={{ width: "100%" }}>
              {index > 0 ? (
                <Space>
                  <Typography.Text type="secondary">Connector</Typography.Text>
                  <Select
                    value={child.joinOperator ?? group.operator}
                    options={operatorOptions}
                    style={{ width: 96 }}
                    onChange={(joinOperator) =>
                      updateChild(index, { ...child, joinOperator })
                    }
                  />
                </Space>
              ) : null}
              {child.type === "rule" ? (
                <MatrixFilterRuleEditor
                  rule={child}
                  matrices={matrices}
                  matrixGroups={matrixGroups}
                  catalogs={catalogs}
                  uiRangeMode={uiRangeMode}
                  onChange={(rule) => updateChild(index, rule)}
                  onDelete={() =>
                    setChildren(group.children.filter((_, itemIndex) => itemIndex !== index))
                  }
                  onMoveUp={() => setChildren(moveItem(group.children, index, -1))}
                  onMoveDown={() => setChildren(moveItem(group.children, index, 1))}
                />
              ) : (
                <MatrixFilterGroupEditor
                  group={child}
                  depth={depth + 1}
                  matrices={matrices}
                  matrixGroups={matrixGroups}
                  catalogs={catalogs}
                  uiRangeMode={uiRangeMode}
                  onChange={(nextGroup) => updateChild(index, nextGroup)}
                  onDelete={() =>
                    setChildren(group.children.filter((_, itemIndex) => itemIndex !== index))
                  }
                  onMoveUp={() => setChildren(moveItem(group.children, index, -1))}
                  onMoveDown={() => setChildren(moveItem(group.children, index, 1))}
                />
              )}
            </Space>
          ))}
        </Space>
      </Space>
    </Card>
  );
}
