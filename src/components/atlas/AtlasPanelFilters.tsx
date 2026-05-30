import { useCallback } from "react";
import { Button, Col, Input, Row, Select, Space, Typography } from "antd";
import { ALL_FILTER } from "./panelConstants";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";
import { useAppDispatch } from "@/store/hooks";
import { setAllLabels } from "@/store/slices/atlasUi";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";

const { Search } = Input;

type AtlasPanelFiltersProps = {
  query: string;
  groupByFields: string[];
  selectedFilters: Record<string, string>;
  fieldOptionsByField: Record<string, Array<{ value: string; label: string }>>;
  totalCount: number;
  allEnabled: boolean;
  allDisabled: boolean;
};

export function AtlasPanelFilters({
  query,
  groupByFields,
  selectedFilters,
  fieldOptionsByField,
  totalCount,
  allEnabled,
  allDisabled,
}: AtlasPanelFiltersProps) {
  const dispatch = useAppDispatch();

  const handleQueryChange = useCallback(
    (query: string) => {
      dispatch(setAtlasPanelState({ query }));
    },
    [dispatch],
  );

  const handleFilterChange = useCallback(
    (field: string, value: string) => {
      dispatch(
        setAtlasPanelState({
          selectedFilters: {
            ...selectedFilters,
            [field]: value,
          },
          collapsedGroups: [],
        }),
      );
    },
    [dispatch, selectedFilters],
  );

  return (
    <Row className="atlas-panel__filters" gutter={[12, 12]}>
      <Col xs={24} sm={12} md={8} className="atlas-panel__filter">
        <Typography.Text type="secondary">Search</Typography.Text>
        <Search
          allowClear
          placeholder="Search ROI label or id"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
        />
      </Col>

      {groupByFields.map((field) => (
        <Col xs={24} sm={12} md={8} key={field} className="atlas-panel__filter">
          <Typography.Text type="secondary">{humanizeFieldName(field)}</Typography.Text>
          <Select
            value={selectedFilters[field] ?? ALL_FILTER}
            options={fieldOptionsByField[field] ?? [{ value: ALL_FILTER, label: "All" }]}
            onChange={(value) => handleFilterChange(field, String(value))}
            style={{ width: "100%" }}
          />
        </Col>
      ))}

      <Col xs={24} sm={12} md={8} className="atlas-panel__filter">
        <Typography.Text type="secondary">Selection</Typography.Text>
        <Space wrap>
          <Button
            onClick={() => dispatch(setAllLabels(true))}
            disabled={allEnabled || totalCount === 0}
          >
            Select All
          </Button>
          <Button
            onClick={() => dispatch(setAllLabels(false))}
            disabled={allDisabled || totalCount === 0}
          >
            Clear All
          </Button>
        </Space>
      </Col>
    </Row>
  );
}
