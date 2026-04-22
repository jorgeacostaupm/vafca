import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Key,
  type CSSProperties,
  type PointerEvent,
} from "react";
import {
  Button,
  Col,
  Collapse,
  Input,
  List,
  Row,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setAllLabels,
  setAtlasColorFields,
  setAtlasColorPalette,
  setLabelEnabled,
  setLabelsEnabled,
} from "@/store/slices/atlasSlice";
import { setAtlasPanelState } from "@/store/slices/visualizationUiSlice";
import {
  ALL_FILTER,
  type GroupedRow,
  useAtlasPanelData,
  useAtlasScene,
} from "./atlas/atlasPanelHooks";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import {
  atlasSupports3d,
  getCommonRoiFields,
  getDefaultGroupByFields,
  humanizeFieldName,
} from "@/utils/atlas/atlasDefinition";
import {
  D3_CATEGORICAL_PALETTES,
  buildAtlasColorCategories,
  type D3CategoricalPaletteKey,
} from "@/utils/atlas/coloring";

const { Search } = Input;
const VIEWER_MIN_HEIGHT = 420;
type ListLayoutMode = "columns" | "single";
type GroupRow = Extract<GroupedRow, { type: "group" }>;
type RoiRow = Extract<GroupedRow, { type: "roi" }>;
type RoiTreeNode = {
  type: "roiNode";
  row: RoiRow;
};
type GroupTreeNode = {
  type: "groupNode";
  row: GroupRow;
  children: GroupTreeEntry[];
};
type GroupTreeEntry = RoiTreeNode | GroupTreeNode;

const moveField = (
  fields: string[],
  field: string,
  direction: "up" | "down",
) => {
  const index = fields.indexOf(field);
  if (index < 0) return fields;
  const delta = direction === "up" ? -1 : 1;
  const target = index + delta;
  if (target < 0 || target >= fields.length) return fields;
  const next = [...fields];
  const current = next[index];
  const nextValue = next[target];
  if (!current || !nextValue) return fields;
  next[index] = nextValue;
  next[target] = current;
  return next;
};

const normalizeUniqueFieldList = (
  fields: string[],
  allowedFields: string[],
) => {
  const seen = new Set<string>();
  const next: string[] = [];
  fields.forEach((field) => {
    if (seen.has(field)) return;
    if (!allowedFields.includes(field)) return;
    seen.add(field);
    next.push(field);
  });
  return next;
};

const areStringArraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const areStringMapsEqual = (
  a: Record<string, string>,
  b: Record<string, string>,
) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!(key in b)) return false;
    if (a[key] !== b[key]) return false;
  }
  return true;
};

const buildGroupTreeEntries = (rows: GroupedRow[]): GroupTreeEntry[] => {
  const roots: GroupTreeEntry[] = [];
  const groupStack: GroupTreeNode[] = [];

  rows.forEach((row) => {
    while (groupStack.length > row.level) {
      groupStack.pop();
    }

    if (row.type === "group") {
      const groupNode: GroupTreeNode = {
        type: "groupNode",
        row,
        children: [],
      };
      const parent = groupStack[groupStack.length - 1];
      if (parent) {
        parent.children.push(groupNode);
      } else {
        roots.push(groupNode);
      }
      groupStack.push(groupNode);
      return;
    }

    const roiNode: RoiTreeNode = {
      type: "roiNode",
      row,
    };
    const parent = groupStack[groupStack.length - 1];
    if (parent) {
      parent.children.push(roiNode);
    } else {
      roots.push(roiNode);
    }
  });

  return roots;
};

const collectRoiIdsFromEntries = (entries: GroupTreeEntry[]): string[] => {
  const ids: string[] = [];
  entries.forEach((entry) => {
    if (entry.type === "roiNode") {
      ids.push(entry.row.id);
      return;
    }
    ids.push(...collectRoiIdsFromEntries(entry.children));
  });
  return ids;
};

const buildGroupRoiIdsByKey = (
  entries: GroupTreeEntry[],
  map: Record<string, string[]> = {},
): Record<string, string[]> => {
  entries.forEach((entry) => {
    if (entry.type !== "groupNode") return;
    map[entry.row.groupKey] = collectRoiIdsFromEntries(entry.children);
    buildGroupRoiIdsByKey(entry.children, map);
  });
  return map;
};

export default function AtlasPanel() {
  const dispatch = useAppDispatch();
  const atlas = useAppSelector((state) => state.atlas);
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlasPanel = useAppSelector(
    (state) => state.visualizationUi.atlasPanel,
  );
  const uploadedAtlasSource = useAppSelector(
    (state) => state.atlasDefinition.uploaded,
  );
  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );

  const availableGroupFields = useMemo(
    () => getCommonRoiFields(atlasDefinition),
    [atlasDefinition],
  );

  const has3d = useMemo(
    () => atlasSupports3d(atlasDefinition, uploadedAtlasSource?.meshMode),
    [atlasDefinition, uploadedAtlasSource?.meshMode],
  );
  const collapsedGroups = useMemo(
    () => new Set(atlasPanel.collapsedGroups),
    [atlasPanel.collapsedGroups],
  );

  const handleToggleLabel = useCallback(
    (id: string, enabled: boolean) => {
      dispatch(setLabelEnabled({ id, enabled }));
    },
    [dispatch],
  );

  const { applyCameraPose } = useAtlasScene({
    atlasDefinition,
    atlas,
    containerRef,
    onToggle: handleToggleLabel,
    enable3d: has3d,
  });

  const {
    fieldOptionsByField,
    groupedRows,
    totalCount,
    enabledCount,
    allEnabled,
    allDisabled,
  } = useAtlasPanelData({
    atlas,
    atlasDefinition,
    query: atlasPanel.query,
    groupByFields: atlasPanel.groupByFields,
    selectedFilters: atlasPanel.selectedFilters,
    collapsedGroups: new Set<string>(),
  });

  useEffect(() => {
    const validColorFields = atlas.colorFields.filter((field) =>
      availableGroupFields.includes(field),
    );
    if (validColorFields.length !== atlas.colorFields.length) {
      dispatch(setAtlasColorFields(validColorFields));
    }
  }, [availableGroupFields, atlas.colorFields, dispatch]);

  useEffect(() => {
    const defaults = getDefaultGroupByFields(availableGroupFields);
    const nextGroupByFields =
      atlasPanel.groupByFields.length > 0
        ? normalizeUniqueFieldList(
            atlasPanel.groupByFields,
            availableGroupFields,
          )
        : defaults;
    const nextSelectedFilters = Object.fromEntries(
      Object.entries(atlasPanel.selectedFilters).filter(([field]) =>
        nextGroupByFields.includes(field),
      ),
    );
    const normalizedViewerHeight = Math.max(
      VIEWER_MIN_HEIGHT,
      atlasPanel.viewerHeight,
    );
    const normalizedListLayoutMode: ListLayoutMode =
      atlasPanel.listLayoutMode === "single" ? "single" : "columns";
    const groupByChanged = !areStringArraysEqual(
      nextGroupByFields,
      atlasPanel.groupByFields,
    );
    const filtersChanged = !areStringMapsEqual(
      nextSelectedFilters,
      atlasPanel.selectedFilters,
    );
    const viewerHeightChanged =
      atlasPanel.viewerHeight !== normalizedViewerHeight;
    const listLayoutChanged =
      atlasPanel.listLayoutMode !== normalizedListLayoutMode;
    const shouldUpdate =
      groupByChanged ||
      filtersChanged ||
      viewerHeightChanged ||
      listLayoutChanged;
    if (!shouldUpdate) return;
    dispatch(
      setAtlasPanelState({
        groupByFields: nextGroupByFields,
        selectedFilters: nextSelectedFilters,
        ...(groupByChanged || filtersChanged ? { collapsedGroups: [] } : {}),
        viewerHeight: normalizedViewerHeight,
        listLayoutMode: normalizedListLayoutMode,
      }),
    );
  }, [
    atlasPanel.groupByFields,
    atlasPanel.listLayoutMode,
    atlasPanel.selectedFilters,
    atlasPanel.viewerHeight,
    availableGroupFields,
    dispatch,
  ]);

  const handleResizePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeStateRef.current = {
        startY: event.clientY,
        startHeight: atlasPanel.viewerHeight,
      };
    },
    [atlasPanel.viewerHeight],
  );

  const handleResizePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;
      const delta = event.clientY - resizeState.startY;
      const nextHeight = Math.max(
        VIEWER_MIN_HEIGHT,
        resizeState.startHeight + delta,
      );
      dispatch(setAtlasPanelState({ viewerHeight: nextHeight }));
    },
    [dispatch],
  );

  const handleResizePointerEnd = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!resizeStateRef.current) return;
      resizeStateRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    },
    [],
  );

  const groupedEntries = useMemo(
    () => buildGroupTreeEntries(groupedRows),
    [groupedRows],
  );
  const groupRoiIdsByKey = useMemo(
    () => buildGroupRoiIdsByKey(groupedEntries),
    [groupedEntries],
  );

  const updateCollapsedGroups = useCallback(
    (groupKeys: string[], activeKeys: Key | Key[]) => {
      const expanded = new Set(
        (Array.isArray(activeKeys) ? activeKeys : [activeKeys])
          .filter((key): key is Key => key !== undefined && key !== null)
          .map((key) => String(key)),
      );
      const nextCollapsed = new Set(atlasPanel.collapsedGroups);
      groupKeys.forEach((key) => {
        if (expanded.has(key)) {
          nextCollapsed.delete(key);
        } else {
          nextCollapsed.add(key);
        }
      });
      dispatch(
        setAtlasPanelState({ collapsedGroups: Array.from(nextCollapsed) }),
      );
    },
    [atlasPanel.collapsedGroups, dispatch],
  );

  const setGroupEnabled = useCallback(
    (groupKey: string, enabled: boolean) => {
      const ids = groupRoiIdsByKey[groupKey] ?? [];
      if (ids.length === 0) return;
      dispatch(setLabelsEnabled({ ids, enabled }));
    },
    [dispatch, groupRoiIdsByKey],
  );

  const selectableGroupFields = availableGroupFields.filter(
    (field) => !atlasPanel.groupByFields.includes(field),
  );
  const selectableColorFields = availableGroupFields.filter(
    (field) => !atlas.colorFields.includes(field),
  );

  const columnSections = useMemo(() => {
    return groupedEntries.flatMap((entry) =>
      entry.type === "groupNode"
        ? [{ key: entry.row.groupKey, entries: [entry] as GroupTreeEntry[] }]
        : [],
    );
  }, [groupedEntries]);

  const canUseColumns =
    atlasPanel.groupByFields.length > 0 && columnSections.length > 0;
  const useColumns = atlasPanel.listLayoutMode === "columns" && canUseColumns;

  const colorCategories = useMemo(() => {
    const enabledIds = new Set(
      atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false),
    );
    return buildAtlasColorCategories({
      atlasDefinition,
      colorFields: atlas.colorFields,
      colorPalette: atlas.colorPalette,
      includedIds: enabledIds,
    }).map((entry) => {
      const label = atlas.colorFields
        .map(
          (field, index) =>
            `${humanizeFieldName(field)}: ${entry.values[index]}`,
        )
        .join(" · ");
      return {
        key: entry.key,
        label,
        count: entry.count,
        color: entry.color,
      };
    });
  }, [
    atlasDefinition,
    atlas.colorFields,
    atlas.colorPalette,
    atlas.order,
    atlas.labelsById,
  ]);

  const colorPreviewItems = useMemo(() => {
    const minimum = 7;
    if (colorCategories.length >= minimum) return colorCategories;
    const palette = D3_CATEGORICAL_PALETTES[atlas.colorPalette];

    const padded = [...colorCategories];
    for (let index = colorCategories.length; index < minimum; index += 1) {
      padded.push({
        key: `palette-slot-${index + 1}`,
        label: `Palette slot ${index + 1}`,
        count: 0,
        color: palette[index % palette.length],
      });
    }
    return padded;
  }, [atlas.colorPalette, colorCategories]);

  const renderRoiRow = useCallback(
    (row: RoiTreeNode) => {
      const id = row.row.id;
      const labelMeta = atlas.labelsById[id];
      const label = labelMeta?.label ?? id;
      const acronym = labelMeta?.acronym;
      const displayLabel =
        acronym && acronym !== label ? `${label} (${acronym})` : label;
      const enabled = atlas.labelsById[id]?.enabled !== false;

      return (
        <List.Item
          actions={[
            <Switch
              key={`toggle-${id}`}
              checked={enabled}
              onChange={(checked) => handleToggleLabel(id, checked)}
              aria-label={`Toggle ${displayLabel}`}
            />,
          ]}
        >
          <List.Item.Meta title={displayLabel} />
        </List.Item>
      );
    },
    [atlas.labelsById, handleToggleLabel],
  );

  const renderGroupedEntries = (entries: GroupTreeEntry[], level = 0) => {
    if (entries.length === 0) {
      return (
        <List
          dataSource={[]}
          renderItem={renderRoiRow}
          locale={{ emptyText: "No labels found for current filters." }}
        />
      );
    }

    const roiRows = entries.flatMap((entry) =>
      entry.type === "roiNode" ? [entry] : [],
    );
    const groupNodes = entries.flatMap((entry) =>
      entry.type === "groupNode" ? [entry] : [],
    );

    if (groupNodes.length === 0) {
      return (
        <List
          dataSource={roiRows}
          renderItem={renderRoiRow}
          locale={{ emptyText: "No labels found for current filters." }}
        />
      );
    }

    const groupKeys = groupNodes.map((group) => group.row.groupKey);
    const activeKeys = groupKeys.filter((key) => !collapsedGroups.has(key));

    if (roiRows.length > 0) {
      return (
        <List
          dataSource={roiRows}
          renderItem={renderRoiRow}
          locale={{ emptyText: "No labels found for current filters." }}
        />
      );
    }

    return (
      <Collapse
        bordered={true}
        className="atlas-panel__group-collapse"
        style={level > 0 ? { marginInlineStart: 10 } : undefined}
        activeKey={activeKeys}
        onChange={(nextKeys) => updateCollapsedGroups(groupKeys, nextKeys)}
        items={groupNodes.map((group) => ({
          key: group.row.groupKey,
          label: (
            <div className="atlas-panel__group-header">
              <Space size={6}>
                <Typography.Text>{group.row.title}</Typography.Text>
                <Typography.Text type="secondary">
                  ({group.row.count})
                </Typography.Text>
              </Space>
              <Space size={4}>
                <Button
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setGroupEnabled(group.row.groupKey, true);
                  }}
                >
                  Select all
                </Button>
                <Button
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setGroupEnabled(group.row.groupKey, false);
                  }}
                >
                  Clear all
                </Button>
              </Space>
            </div>
          ),
          children: renderGroupedEntries(group.children, level + 1),
        }))}
      />
    );
  };

  const controlsBlock = (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Space direction="vertical" size={2}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            ROIs Management
          </Typography.Title>
          <Typography.Text type="secondary">
            {totalCount} ROIs · {enabledCount} active
          </Typography.Text>
        </Space>
      </Space>

      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Typography.Text strong>
          Grouping fields (order matters)
        </Typography.Text>

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {atlasPanel.groupByFields.map((field, index) => (
            <div key={field} className="atlas-panel__field-row">
              <Typography.Text strong>
                {humanizeFieldName(field)}
              </Typography.Text>
              <Space>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  onClick={() =>
                    dispatch(
                      setAtlasPanelState({
                        groupByFields: moveField(
                          atlasPanel.groupByFields,
                          field,
                          "up",
                        ),
                        collapsedGroups: [],
                      }),
                    )
                  }
                  disabled={index === 0}
                  aria-label={`Move ${humanizeFieldName(field)} up`}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() =>
                    dispatch(
                      setAtlasPanelState({
                        groupByFields: moveField(
                          atlasPanel.groupByFields,
                          field,
                          "down",
                        ),
                        collapsedGroups: [],
                      }),
                    )
                  }
                  disabled={index === atlasPanel.groupByFields.length - 1}
                  aria-label={`Move ${humanizeFieldName(field)} down`}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const nextGroupByFields = atlasPanel.groupByFields.filter(
                      (value) => value !== field,
                    );
                    const nextSelectedFilters = {
                      ...atlasPanel.selectedFilters,
                    };
                    delete nextSelectedFilters[field];
                    dispatch(
                      setAtlasPanelState({
                        groupByFields: nextGroupByFields,
                        selectedFilters: nextSelectedFilters,
                        collapsedGroups: [],
                      }),
                    );
                  }}
                  aria-label={`Remove ${humanizeFieldName(field)}`}
                />
              </Space>
            </div>
          ))}
        </Space>

        <Select
          placeholder="Add field"
          style={{ width: "100%" }}
          options={selectableGroupFields.map((field) => ({
            value: field,
            label: humanizeFieldName(field),
          }))}
          onChange={(value) => {
            const field = String(value);
            dispatch(
              setAtlasPanelState({
                groupByFields: [...atlasPanel.groupByFields, field],
                collapsedGroups: [],
              }),
            );
          }}
          value={undefined}
        />
      </Space>

      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Typography.Text strong>
          Color fields (categorical palette)
        </Typography.Text>

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          {atlas.colorFields.map((field, index) => (
            <div key={field} className="atlas-panel__field-row">
              <Typography.Text strong>
                {humanizeFieldName(field)}
              </Typography.Text>
              <Space>
                <Button
                  size="small"
                  icon={<ArrowUpOutlined />}
                  onClick={() =>
                    dispatch(
                      setAtlasColorFields(
                        moveField(atlas.colorFields, field, "up"),
                      ),
                    )
                  }
                  disabled={index === 0}
                  aria-label={`Move ${humanizeFieldName(field)} up`}
                />
                <Button
                  size="small"
                  icon={<ArrowDownOutlined />}
                  onClick={() =>
                    dispatch(
                      setAtlasColorFields(
                        moveField(atlas.colorFields, field, "down"),
                      ),
                    )
                  }
                  disabled={index === atlas.colorFields.length - 1}
                  aria-label={`Move ${humanizeFieldName(field)} down`}
                />
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    dispatch(
                      setAtlasColorFields(
                        atlas.colorFields.filter((value) => value !== field),
                      ),
                    )
                  }
                  aria-label={`Remove ${humanizeFieldName(field)}`}
                />
              </Space>
            </div>
          ))}
        </Space>

        <Select
          placeholder="Add color field"
          style={{ width: "100%" }}
          options={selectableColorFields.map((field) => ({
            value: field,
            label: humanizeFieldName(field),
          }))}
          onChange={(value) => {
            const field = String(value);
            dispatch(setAtlasColorFields([...atlas.colorFields, field]));
          }}
          value={undefined}
        />

        {atlas.colorFields.length === 0 ? (
          <Typography.Text type="secondary">
            No color fields selected. All ROIs use the first color of the
            selected palette.
          </Typography.Text>
        ) : (
          <>
            <div className="atlas-panel__color-preview">
              {colorCategories.length === 0 ? (
                <Typography.Text type="secondary">
                  No categories available.
                </Typography.Text>
              ) : (
                colorPreviewItems.map((category) => (
                  <div
                    key={category.key}
                    className={`atlas-panel__color-category ${
                      category.count === 0
                        ? "atlas-panel__color-category--empty"
                        : ""
                    }`}
                  >
                    <span
                      className="atlas-panel__color-swatch"
                      style={{ backgroundColor: category.color }}
                    />
                    <Typography.Text ellipsis={{ tooltip: category.label }}>
                      {category.label}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {category.count > 0 ? `(${category.count})` : "(preview)"}
                    </Typography.Text>
                  </div>
                ))
              )}
            </div>

            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <Typography.Text type="secondary">Palette</Typography.Text>
              <Select
                value={atlas.colorPalette}
                style={{ width: "100%" }}
                onChange={(value) =>
                  dispatch(
                    setAtlasColorPalette(value as D3CategoricalPaletteKey),
                  )
                }
                options={Object.keys(D3_CATEGORICAL_PALETTES).map((key) => ({
                  value: key,
                  label: `D3 ${key}`,
                }))}
              />
            </Space>
          </>
        )}
      </Space>
    </Space>
  );

  const listSelectorsBlock = (
    <Row className="atlas-panel__filters" gutter={[12, 12]}>
      <Col xs={24} sm={12} md={8} className="atlas-panel__filter">
        <Typography.Text type="secondary">Search</Typography.Text>
        <Search
          allowClear
          placeholder="Search ROI label or id"
          value={atlasPanel.query}
          onChange={(event) =>
            dispatch(setAtlasPanelState({ query: event.target.value }))
          }
        />
      </Col>
      {atlasPanel.groupByFields.map((field) => (
        <Col xs={24} sm={12} md={8} key={field} className="atlas-panel__filter">
          <Typography.Text type="secondary">
            {humanizeFieldName(field)}
          </Typography.Text>
          <Select
            value={atlasPanel.selectedFilters[field] ?? ALL_FILTER}
            options={
              fieldOptionsByField[field] ?? [
                { value: ALL_FILTER, label: "All" },
              ]
            }
            onChange={(value) => {
              dispatch(
                setAtlasPanelState({
                  selectedFilters: {
                    ...atlasPanel.selectedFilters,
                    [field]: value,
                  },
                  collapsedGroups: [],
                }),
              );
            }}
            style={{ width: "100%" }}
          />
        </Col>
      ))}
      <Col xs={24} sm={12} md={8} className="atlas-panel__filter">
        <Typography.Text type="secondary">List layout</Typography.Text>
        <Select
          value={useColumns ? "columns" : "single"}
          options={[
            { value: "columns", label: "Columns by first field" },
            { value: "single", label: "Single column" },
          ]}
          onChange={(value) =>
            dispatch(
              setAtlasPanelState({ listLayoutMode: value as ListLayoutMode }),
            )
          }
          style={{ width: "100%" }}
          disabled={!canUseColumns}
        />
      </Col>
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

  const listBlock = useColumns ? (
    <div className="atlas-panel__columns-wrap">
      <div
        className="atlas-panel__columns"
        style={
          {
            "--atlas-column-count": String(columnSections.length),
          } as CSSProperties
        }
      >
        {columnSections.map((section) => (
          <Fragment key={section.key}>
            {renderGroupedEntries(section.entries)}
          </Fragment>
        ))}
      </div>
    </div>
  ) : (
    renderGroupedEntries(groupedEntries)
  );

  return (
    <Row className="atlas-panel" gutter={[24, 24]} align="top">
      {has3d ? (
        <>
          <Col xs={24} lg={10}>
            <div className="atlas-panel__list">{controlsBlock}</div>
          </Col>
          <Col xs={24} lg={14}>
            <div className="atlas-panel__viewer">
              <div className="atlas-panel__viewer-header">
                <Space size={8}>
                  <Button size="small" onClick={() => applyCameraPose(0, 1, 0)}>
                    Front
                  </Button>
                  <Button size="small" onClick={() => applyCameraPose(1, 0, 0)}>
                    Right
                  </Button>
                  <Button size="small" onClick={() => applyCameraPose(0, 0, 1)}>
                    Top
                  </Button>
                  <Button
                    size="small"
                    onClick={() => applyCameraPose(-1, 0, 0)}
                  >
                    Left
                  </Button>
                </Space>
                <Typography.Text type="secondary">
                  Double-click an ROI to hide it
                </Typography.Text>
              </div>
              <div
                className="atlas-panel__viewer-canvas"
                ref={containerRef}
                style={{ height: `${atlasPanel.viewerHeight}px` }}
              />
              <button
                type="button"
                className="atlas-panel__viewer-resizer"
                aria-label="Resize atlas viewer"
                onPointerDown={handleResizePointerDown}
                onPointerMove={handleResizePointerMove}
                onPointerUp={handleResizePointerEnd}
                onPointerCancel={handleResizePointerEnd}
              />
            </div>
          </Col>
          <Col xs={24}>
            <div className="atlas-panel__list">
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {listSelectorsBlock}
                {listBlock}
              </Space>
            </div>
          </Col>
        </>
      ) : (
        <Col xs={24}>
          <div className="atlas-panel__list">
            {controlsBlock}
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {listSelectorsBlock}
              {listBlock}
            </Space>
          </div>
        </Col>
      )}
    </Row>
  );
}
