import { Button, Col, Input, Row, Select, Space, Typography } from "antd";
import { ALL_FILTER } from "./panelConstants";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

const { Search } = Input;

type AtlasPanelFiltersProps = {
  query: string;
  groupByFields: string[];
  selectedFilters: Record<string, string>;
  fieldOptionsByField: Record<string, Array<{ value: string; label: string }>>;
  totalCount: number;
  allEnabled: boolean;
  allDisabled: boolean;
  onQueryChange: (query: string) => void;
  onFilterChange: (field: string, value: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
};

export function AtlasPanelFilters({
  query,
  groupByFields,
  selectedFilters,
  fieldOptionsByField,
  totalCount,
  allEnabled,
  allDisabled,
  onQueryChange,
  onFilterChange,
  onSelectAll,
  onClearAll,
}: AtlasPanelFiltersProps) {
  return (
    <Row className="atlas-panel__filters" gutter={[12, 12]}>
      <Col xs={24} sm={12} md={8} className="atlas-panel__filter">
        <Typography.Text type="secondary">Search</Typography.Text>
        <Search
          allowClear
          placeholder="Search ROI label or id"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </Col>

      {groupByFields.map((field) => (
        <Col xs={24} sm={12} md={8} key={field} className="atlas-panel__filter">
          <Typography.Text type="secondary">{humanizeFieldName(field)}</Typography.Text>
          <Select
            value={selectedFilters[field] ?? ALL_FILTER}
            options={fieldOptionsByField[field] ?? [{ value: ALL_FILTER, label: "All" }]}
            onChange={(value) => onFilterChange(field, String(value))}
            style={{ width: "100%" }}
          />
        </Col>
      ))}

      <Col xs={24} sm={12} md={8} className="atlas-panel__filter">
        <Typography.Text type="secondary">Selection</Typography.Text>
        <Space wrap>
          <Button onClick={onSelectAll} disabled={allEnabled || totalCount === 0}>
            Select All
          </Button>
          <Button onClick={onClearAll} disabled={allDisabled || totalCount === 0}>
            Clear All
          </Button>
        </Space>
      </Col>
    </Row>
  );
}
