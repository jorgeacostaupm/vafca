import { CheckOutlined, CheckSquareOutlined, ClearOutlined } from "@ant-design/icons";
import { Button, Col, Input, Row, Select, Space, Tooltip, Typography } from "antd";
import { useCallback, useMemo } from "react";
import { shallowEqual } from "react-redux";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLabelsEnabledMap } from "@/store/slices/atlasUi";
import { recomputeAggregatedNetworksForActiveNodes } from "@/store/slices/dataset";
import { setAtlasPanelState } from "@/store/slices/visualizationUi";
import { humanizeFieldName } from "@/utils/atlas/atlasDefinition";

import {
  buildEffectiveNodeEnabledMap,
  countChangedNodes,
} from "./nodeVisibilityDraft";
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
  const { atlasOrder, draft, labelsById } = useAppSelector(
    (state) => ({
      atlasOrder: state.atlasUi.order,
      draft: state.visualizationUi.atlasPanel.nodeVisibilityDraft,
      labelsById: state.atlasUi.labelsById,
    }),
    shallowEqual,
  );
  const pendingCount = useMemo(
    () => countChangedNodes({ order: atlasOrder, labelsById, draft }),
    [atlasOrder, draft, labelsById],
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      dispatch(setAtlasPanelState({ query }));
    },
    [dispatch],
  );

  const handleFilterChange = useCallback(
    (field: string, value: string | undefined) => {
      const nextSelectedFilters = { ...selectedFilters };
      if (!value || value === ALL_FILTER) {
        delete nextSelectedFilters[field];
      } else {
        nextSelectedFilters[field] = value;
      }

      dispatch(
        setAtlasPanelState({
          selectedFilters: nextSelectedFilters,
          collapsedGroups: [],
        }),
      );
    },
    [dispatch, selectedFilters],
  );

  const handleApply = useCallback(() => {
    if (!draft) return;
    dispatch(
      setLabelsEnabledMap(
        buildEffectiveNodeEnabledMap({ order: atlasOrder, labelsById, draft }),
      ),
    );
    dispatch(setAtlasPanelState({ nodeVisibilityDraft: null }));
    void dispatch(recomputeAggregatedNetworksForActiveNodes());
  }, [atlasOrder, dispatch, draft, labelsById]);

  return (
    <Row className="atlas-panel__filters" gutter={[12, 12]}>
      <Col xs={24} sm={12} md={8} className="atlas-panel__filter">
        <Typography.Text type="secondary">Search</Typography.Text>
        <Search
          allowClear
          placeholder="Search Node label or id"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
        />
      </Col>

      {groupByFields.map((field) => (
        <Col xs={24} sm={12} md={8} key={field} className="atlas-panel__filter">
          <Typography.Text type="secondary">{humanizeFieldName(field)}</Typography.Text>
          <Select
            allowClear
            placeholder="All"
            value={selectedFilters[field] === ALL_FILTER ? undefined : selectedFilters[field]}
            options={fieldOptionsByField[field] ?? [{ value: ALL_FILTER, label: "All" }]}
            onChange={(value) => handleFilterChange(field, value)}
            className="atlas-panel__filter-select"
          />
        </Col>
      ))}

      <Col xs={24} sm={24} md={24} className="atlas-panel__filter atlas-panel__selection-actions">
        <Space>
          <Tooltip title="Select all nodes">
            <Button
              type="primary"
              icon={<CheckSquareOutlined />}
              aria-label="Select all nodes"
              onClick={() =>
                dispatch(
                  setAtlasPanelState({
                    nodeVisibilityDraft: Object.fromEntries(
                      atlasOrder.map((id) => [id, true]),
                    ),
                  }),
                )
              }
              disabled={allEnabled || totalCount === 0}
            >
              Select All
            </Button>
          </Tooltip>
          <Tooltip title="Clear all nodes">
            <Button
              type="primary"
              icon={<ClearOutlined />}
              aria-label="Clear all nodes"
              onClick={() =>
                dispatch(
                  setAtlasPanelState({
                    nodeVisibilityDraft: Object.fromEntries(
                      atlasOrder.map((id) => [id, false]),
                    ),
                  }),
                )
              }
              disabled={allDisabled || totalCount === 0}
            >
              Clear All
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApply}
            disabled={pendingCount === 0}
          >
            Apply
          </Button>
        </Space>
      </Col>
    </Row>
  );
}
