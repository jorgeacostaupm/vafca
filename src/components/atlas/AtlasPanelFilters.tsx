import { SettingOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row, Select, Space, Typography } from "antd";
import { useCallback } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

import { ALL_FILTER } from "./panelConstants";

const { Search } = Input;

type AtlasPanelFiltersProps = {
  query: string;
  groupByFields: string[];
  selectedFilters: Record<string, string>;
  fieldOptionsByField: Record<string, Array<{ value: string; label: string }>>;
  totalCount: number;
  allEnabled: boolean;
  allDisabled: boolean;
  onOpenSettings: () => void;
};

export function AtlasPanelFilters({
  query,
  groupByFields,
  selectedFilters,
  fieldOptionsByField,
  totalCount,
  allEnabled,
  allDisabled,
  onOpenSettings,
}: AtlasPanelFiltersProps) {
  const dispatch = useAppDispatch();
  const atlasOrder = useAppSelector((state) => state.atlasUi.order);

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
            onClick={() =>
              dispatch(
                setAtlasPanelState({
                  roiVisibilityDraft: Object.fromEntries(
                    atlasOrder.map((id) => [id, true]),
                  ),
                }),
              )
            }
            disabled={allEnabled || totalCount === 0}
          >
            Select All
          </Button>
          <Button
            onClick={() =>
              dispatch(
                setAtlasPanelState({
                  roiVisibilityDraft: Object.fromEntries(
                    atlasOrder.map((id) => [id, false]),
                  ),
                }),
              )
            }
            disabled={allDisabled || totalCount === 0}
          >
            Clear All
          </Button>
          <Button
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
            aria-label="Open atlas settings"
          >
            Settings
          </Button>
        </Space>
      </Col>
    </Row>
  );
}
