import {
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateCatalogItem, updateMetadata } from "@/store/slices/datasetSlice";
import { setMatrixShape } from "@/store/slices/visualizationUiSlice";
import {
  patchNetworkControls,
  setNetworkHideIsolatedNodes,
} from "@/store/slices/networkVisualizationSlice";
import {
  setCircularHierarchyCategoryOrder,
  setCircularHierarchyFields,
  setMatrixHierarchyCategoryOrder,
  setMatrixHierarchyFields,
} from "@/store/slices/atlasSlice";
import NetworkManagementControls from "@/components/network/NetworkManagementControls";
import { getAllMatrices } from "@/utils/matrixStore";
import { normalizeMatrixOrder } from "@/utils/matrixOrder";
import AtlasUploader from "@/components/atlas/AtlasUploader";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import {
  getCommonRoiFields,
  humanizeFieldName,
  normalizeRoiFieldValue,
} from "@/utils/atlas/atlasDefinition";
import { buildAtlasRoiColorById } from "@/utils/atlas/coloring";
import {
  buildCircularCategoryOrderKey,
  buildCircularHierarchyLayout,
} from "@/utils/circular/hierarchy";

type CatalogKey = "bands" | "measures" | "stats" | "populations";

const isEnabled = (value: { enabled?: boolean } | undefined) =>
  value?.enabled !== false;

const normalizeNumber = (value: number | null) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const PREVIEW_SIZE = 280;
const PREVIEW_PADDING = 24;
const MATRIX_PREVIEW_HEIGHT = 96;

const moveField = (fields: string[], field: string, direction: "up" | "down") => {
  const index = fields.indexOf(field);
  if (index < 0) return fields;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= fields.length) return fields;
  const next = [...fields];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const moveValue = (values: string[], value: string, direction: "up" | "down") => {
  const index = values.indexOf(value);
  if (index < 0) return values;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= values.length) return values;
  const next = [...values];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const reverseValues = (values: string[]) => [...values].reverse();

type CategoryOrderEditor = {
  key: string;
  field: string;
  parentValues: string[];
  values: string[];
};

type BuildCategoryOrderEditorsArgs = {
  atlasDefinition: ReturnType<typeof useAtlasDefinition>;
  hierarchyFields: string[];
  categoryOrder: Record<string, string[]>;
  sourceIds: string[];
};

const buildCategoryOrderEditors = ({
  atlasDefinition,
  hierarchyFields,
  categoryOrder,
  sourceIds,
}: BuildCategoryOrderEditorsArgs): CategoryOrderEditor[] => {
  if (!atlasDefinition?.rois?.length || hierarchyFields.length === 0) {
    return [];
  }

  const roiById = new Map(
    atlasDefinition.rois.map((roi) => [String(roi.id), roi] as const),
  );
  const editorMap = new Map<
    string,
    {
      field: string;
      parentValues: string[];
      values: Set<string>;
    }
  >();

  sourceIds.forEach((roiId) => {
    const roi = roiById.get(roiId);
    if (!roi) return;

    const parentValues: string[] = [];
    hierarchyFields.forEach((field, fieldIndex) => {
      const orderKey = buildCircularCategoryOrderKey(fieldIndex, parentValues);
      if (!editorMap.has(orderKey)) {
        editorMap.set(orderKey, {
          field,
          parentValues: [...parentValues],
          values: new Set<string>(),
        });
      }
      const value = normalizeRoiFieldValue(roi[field]);
      editorMap.get(orderKey)?.values.add(value);
      parentValues.push(value);
    });
  });

  return Array.from(editorMap.entries())
    .map(([key, entry]) => {
      const availableValues = Array.from(entry.values).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      const configured = categoryOrder[key] ?? [];
      const configuredSet = new Set(configured);
      const ordered = [
        ...configured.filter((value) => entry.values.has(value)),
        ...availableValues.filter((value) => !configuredSet.has(value)),
      ];
      return {
        key,
        field: entry.field,
        parentValues: entry.parentValues,
        values: ordered,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { sensitivity: "base" }));
};

const areCategoryOrdersEqual = (
  current: Record<string, string[]>,
  next: Record<string, string[]>,
) => {
  const currentKeys = Object.keys(current).sort();
  const nextKeys = Object.keys(next).sort();
  const sameKeys =
    currentKeys.length === nextKeys.length &&
    currentKeys.every((key, index) => key === nextKeys[index]);
  if (!sameKeys) return false;
  return nextKeys.every((key) => {
    const a = current[key] ?? [];
    const b = next[key] ?? [];
    return a.length === b.length && a.every((value, index) => value === b[index]);
  });
};

function DatasetManagement() {
  const dispatch = useAppDispatch();
  const { data, status, error } = useAppSelector((state) => state.dataset);
  const matrixShape = useAppSelector((state) => state.visualizationUi.matrixShape);
  const networkControls = useAppSelector(
    (state) => state.networkVisualization.controls,
  );
  const atlas = useAppSelector((state) => state.atlas);
  const atlasDefinition = useAtlasDefinition(
    data?.metadata.atlasId ?? data?.metadata.atlas,
  );
  const availableHierarchyFields = useMemo(
    () => getCommonRoiFields(atlasDefinition),
    [atlasDefinition],
  );
  const selectableCircularHierarchyFields = useMemo(
    () =>
      availableHierarchyFields.filter(
        (field) => !atlas.circularHierarchyFields.includes(field),
      ),
    [availableHierarchyFields, atlas.circularHierarchyFields],
  );
  const selectableMatrixHierarchyFields = useMemo(
    () =>
      availableHierarchyFields.filter(
        (field) => !atlas.matrixHierarchyFields.includes(field),
      ),
    [availableHierarchyFields, atlas.matrixHierarchyFields],
  );
  const activeRoiIds = useMemo(() => {
    const enabled = atlas.order.filter((id) => atlas.labelsById[id]?.enabled !== false);
    return enabled.length > 0 ? enabled : atlas.order;
  }, [atlas.labelsById, atlas.order]);
  const previewRadius = PREVIEW_SIZE / 2 - PREVIEW_PADDING;
  const circularPreviewLayout = useMemo(
    () =>
      buildCircularHierarchyLayout({
        labelIds: activeRoiIds.slice(0, 220),
        radius: previewRadius,
        atlasDefinition,
        hierarchyFields: atlas.circularHierarchyFields,
        categoryOrder: atlas.circularHierarchyCategoryOrder,
      }),
    [
      activeRoiIds,
      previewRadius,
      atlasDefinition,
      atlas.circularHierarchyFields,
      atlas.circularHierarchyCategoryOrder,
    ],
  );
  const matrixPreviewLayout = useMemo(
    () =>
      buildCircularHierarchyLayout({
        labelIds: activeRoiIds.slice(0, 220),
        radius: 1,
        atlasDefinition,
        hierarchyFields: atlas.matrixHierarchyFields,
        categoryOrder: atlas.matrixHierarchyCategoryOrder,
      }),
    [
      activeRoiIds,
      atlasDefinition,
      atlas.matrixHierarchyFields,
      atlas.matrixHierarchyCategoryOrder,
    ],
  );
  const matrixPreviewIds = useMemo(
    () =>
      [...matrixPreviewLayout]
        .sort((a, b) => a.order - b.order)
        .map((entry) => entry.labelId),
    [matrixPreviewLayout],
  );
  const previewNodeColors = useMemo(
    () =>
      buildAtlasRoiColorById({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      }),
    [atlasDefinition, atlas.colorFields, atlas.colorPalette],
  );
  const circularCategoryOrderEditors = useMemo(
    () =>
      buildCategoryOrderEditors({
        atlasDefinition,
        hierarchyFields: atlas.circularHierarchyFields,
        categoryOrder: atlas.circularHierarchyCategoryOrder,
        sourceIds: activeRoiIds,
      }),
    [
      atlasDefinition,
      atlas.circularHierarchyFields,
      atlas.circularHierarchyCategoryOrder,
      activeRoiIds,
    ],
  );
  const matrixCategoryOrderEditors = useMemo(
    () =>
      buildCategoryOrderEditors({
        atlasDefinition,
        hierarchyFields: atlas.matrixHierarchyFields,
        categoryOrder: atlas.matrixHierarchyCategoryOrder,
        sourceIds: activeRoiIds,
      }),
    [
      atlasDefinition,
      atlas.matrixHierarchyFields,
      atlas.matrixHierarchyCategoryOrder,
      activeRoiIds,
    ],
  );

  useEffect(() => {
    if (!atlasDefinition?.rois?.length) return;
    const valid = atlas.circularHierarchyFields.filter((field) =>
      availableHierarchyFields.includes(field),
    );
    if (valid.length !== atlas.circularHierarchyFields.length) {
      dispatch(setCircularHierarchyFields(valid));
    }
  }, [atlasDefinition, availableHierarchyFields, atlas.circularHierarchyFields, dispatch]);
  useEffect(() => {
    if (!atlasDefinition?.rois?.length) return;
    const valid = atlas.matrixHierarchyFields.filter((field) =>
      availableHierarchyFields.includes(field),
    );
    if (valid.length !== atlas.matrixHierarchyFields.length) {
      dispatch(setMatrixHierarchyFields(valid));
    }
  }, [atlasDefinition, availableHierarchyFields, atlas.matrixHierarchyFields, dispatch]);

  useEffect(() => {
    const cleaned = circularCategoryOrderEditors.reduce<Record<string, string[]>>(
      (acc, editor) => {
        if (editor.values.length > 0) {
          acc[editor.key] = editor.values;
        }
        return acc;
      },
      {},
    );
    if (!areCategoryOrdersEqual(atlas.circularHierarchyCategoryOrder, cleaned)) {
      dispatch(setCircularHierarchyCategoryOrder(cleaned));
    }
  }, [circularCategoryOrderEditors, atlas.circularHierarchyCategoryOrder, dispatch]);
  useEffect(() => {
    const cleaned = matrixCategoryOrderEditors.reduce<Record<string, string[]>>(
      (acc, editor) => {
        if (editor.values.length > 0) {
          acc[editor.key] = editor.values;
        }
        return acc;
      },
      {},
    );
    if (!areCategoryOrdersEqual(atlas.matrixHierarchyCategoryOrder, cleaned)) {
      dispatch(setMatrixHierarchyCategoryOrder(cleaned));
    }
  }, [matrixCategoryOrderEditors, atlas.matrixHierarchyCategoryOrder, dispatch]);

  if (status === "loading") {
    return <Typography.Text>Loading dataset…</Typography.Text>;
  }

  if (status === "error") {
    return <Typography.Text type="danger">Error: {error}</Typography.Text>;
  }

  if (!data) {
    return <Typography.Text>No dataset loaded yet.</Typography.Text>;
  }

  const matrixOrder = normalizeMatrixOrder(data.metadata.matrixOrder);
  const atlasLabel = data.metadata.atlasId ?? data.metadata.atlas ?? "Unknown";

  const updateItem = (
    catalog: CatalogKey,
    id: string,
    changes: Record<string, unknown>,
  ) => {
    dispatch(updateCatalogItem({ catalog, id, changes }));
  };

  const handleDownload = async () => {
    const matrices = await getAllMatrices();
    const payload = {
      metadata: data.metadata,
      catalogs: data.catalogs,
      matrices,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dataset-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <AtlasUploader />

      <Space wrap size={16}>
        <Space size={6}>
          <Typography.Text strong>Atlas:</Typography.Text>
          <Typography.Text type="secondary">
            {atlasLabel}
          </Typography.Text>
        </Space>
        <Space size={6}>
          <Typography.Text strong>ROI count:</Typography.Text>
          <Typography.Text type="secondary">
            {matrixOrder.length}
          </Typography.Text>
        </Space>
        <Space size={6}>
          <Typography.Text strong>Matrices:</Typography.Text>
          <Typography.Text type="secondary">
            {data.matrixStats.total}
          </Typography.Text>
        </Space>
        <Space size={6}>
          <Typography.Text strong>Matrix shape:</Typography.Text>
          <Select
            size="small"
            value={matrixShape}
            options={[
              { value: "full", label: "Full matrix" },
              { value: "upper", label: "Upper triangular" },
              { value: "lower", label: "Lower triangular" },
            ]}
            onChange={(value) => {
              dispatch(updateMetadata({ changes: { matrixShape: value } }));
              dispatch(setMatrixShape(value));
            }}
          />
        </Space>
      </Space>

      <div>
        <NetworkManagementControls
          syncZoom={networkControls.syncZoom}
          onToggleSyncZoom={(value) =>
            dispatch(
              patchNetworkControls({
                syncZoom: value,
              }),
            )
          }
          hideIsolatedNodes={networkControls.hideIsolatedNodes}
          onToggleHideIsolatedNodes={(value) =>
            dispatch(
              setNetworkHideIsolatedNodes({
                value,
              }),
            )
          }
        />
      </div>

      <div>
        <Typography.Text strong>Matrix summary</Typography.Text>
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          {Object.entries(data.matrixStats.byMeasureStatPopulationSet).map(
            ([measureId, statMap]) => (
              <Typography.Text key={measureId} type="secondary">
                {(data.catalogs.measures[measureId]?.label ?? measureId) + ": "}
                {Object.entries(statMap)
                  .map(([statId, popMap]) => {
                    const total = Object.values(popMap).reduce(
                      (acc, value) => acc + value,
                      0,
                    );
                    const perPopulationSet = Object.entries(popMap)
                      .map(([populationKey, count]) => {
                        const label = populationKey
                          .split("+")
                          .map(
                            (id) => data.catalogs.populations[id]?.label ?? id,
                          )
                          .join("+");
                        return `${label} ${count}`;
                      })
                      .join(", ");
                    return `${
                      data.catalogs.stats[statId]?.label ?? statId
                    } ${total} (${perPopulationSet})`;
                  })
                  .join(" · ")}
              </Typography.Text>
            ),
          )}
        </Space>
      </div>

      <Button size="small" onClick={handleDownload}>
        Download dataset as JSON
      </Button>

      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Circular hierarchy (global)</Typography.Text>
        <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
          <Typography.Text type="secondary">
            Order the atlas fields to define how circular nodes are grouped.
          </Typography.Text>

          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {atlas.circularHierarchyFields.map((field, index) => (
              <div key={field} className="atlas-panel__field-row">
                <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
                <Space>
                  <Button
                    size="small"
                    icon={<ArrowUpOutlined />}
                    onClick={() =>
                      dispatch(
                        setCircularHierarchyFields(
                          moveField(atlas.circularHierarchyFields, field, "up"),
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
                        setCircularHierarchyFields(
                          moveField(atlas.circularHierarchyFields, field, "down"),
                        ),
                      )
                    }
                    disabled={index === atlas.circularHierarchyFields.length - 1}
                    aria-label={`Move ${humanizeFieldName(field)} down`}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      dispatch(
                        setCircularHierarchyFields(
                          atlas.circularHierarchyFields.filter((value) => value !== field),
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
            placeholder="Add hierarchy field"
            style={{ width: "100%" }}
            options={selectableCircularHierarchyFields.map((field) => ({
              value: field,
              label: humanizeFieldName(field),
            }))}
            value={undefined}
            onChange={(value) => {
              const field = String(value);
              dispatch(
                setCircularHierarchyFields([...atlas.circularHierarchyFields, field]),
              );
            }}
          />

          <Button
            size="small"
            onClick={() =>
              dispatch(setCircularHierarchyFields(reverseValues(atlas.circularHierarchyFields)))
            }
            disabled={atlas.circularHierarchyFields.length < 2}
          >
            Invert hierarchy order
          </Button>

          {atlas.circularHierarchyFields.length === 0 ? (
            <Typography.Text type="secondary">
              No hierarchy fields selected. Circular layout uses a uniform order.
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              Active hierarchy:{" "}
              {atlas.circularHierarchyFields.map(humanizeFieldName).join(" → ")}
            </Typography.Text>
          )}

          {circularCategoryOrderEditors.length > 0 && (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Typography.Text strong>Category order per branch</Typography.Text>
              {circularCategoryOrderEditors.map((editor) => {
                const parentDescription =
                  editor.parentValues.length === 0
                    ? "Root level"
                    : editor.parentValues
                        .map((value, index) => {
                          const parentField = atlas.circularHierarchyFields[index] ?? "";
                          return `${humanizeFieldName(parentField)}: ${value}`;
                        })
                        .join(" · ");
                return (
                  <div
                    key={editor.key}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      padding: 8,
                      background: "var(--color-surface)",
                    }}
                  >
                    <Typography.Text strong>
                      {humanizeFieldName(editor.field)}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block" }}>
                      {parentDescription}
                    </Typography.Text>
                    <Button
                      size="small"
                      style={{ marginTop: 6 }}
                      onClick={() => {
                        const next = {
                          ...atlas.circularHierarchyCategoryOrder,
                          [editor.key]: reverseValues(editor.values),
                        };
                        dispatch(setCircularHierarchyCategoryOrder(next));
                      }}
                      disabled={editor.values.length < 2}
                    >
                      Invert branch order
                    </Button>
                    <Space
                      direction="vertical"
                      size={6}
                      style={{ width: "100%", marginTop: 6 }}
                    >
                      {editor.values.map((value, index) => (
                        <div key={value} className="atlas-panel__field-row">
                          <Typography.Text>{value}</Typography.Text>
                          <Space>
                            <Button
                              size="small"
                              icon={<ArrowUpOutlined />}
                              onClick={() => {
                                const next = {
                                  ...atlas.circularHierarchyCategoryOrder,
                                  [editor.key]: moveValue(editor.values, value, "up"),
                                };
                                dispatch(setCircularHierarchyCategoryOrder(next));
                              }}
                              disabled={index === 0}
                              aria-label={`Move ${value} up`}
                            />
                            <Button
                              size="small"
                              icon={<ArrowDownOutlined />}
                              onClick={() => {
                                const next = {
                                  ...atlas.circularHierarchyCategoryOrder,
                                  [editor.key]: moveValue(editor.values, value, "down"),
                                };
                                dispatch(setCircularHierarchyCategoryOrder(next));
                              }}
                              disabled={index === editor.values.length - 1}
                              aria-label={`Move ${value} down`}
                            />
                          </Space>
                        </div>
                      ))}
                    </Space>
                  </div>
                );
              })}
            </Space>
          )}

          <div
            style={{
              width: PREVIEW_SIZE,
              maxWidth: "100%",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <Typography.Text type="secondary">Circular preview</Typography.Text>
            <svg width={PREVIEW_SIZE} height={PREVIEW_SIZE} style={{ display: "block" }}>
              <circle
                cx={PREVIEW_SIZE / 2}
                cy={PREVIEW_SIZE / 2}
                r={previewRadius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              {circularPreviewLayout.map((node) => (
                <circle
                  key={node.labelId}
                  cx={PREVIEW_SIZE / 2 + node.x}
                  cy={PREVIEW_SIZE / 2 + node.y}
                  r={2}
                  fill={previewNodeColors[node.labelId] ?? "var(--color-primary)"}
                >
                  <title>{node.labelId}</title>
                </circle>
              ))}
            </svg>
            <Typography.Text type="secondary">
              Showing {circularPreviewLayout.length} / {activeRoiIds.length} ROIs
            </Typography.Text>
          </div>
        </Space>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Matrix node order (X axis)</Typography.Text>
        <Space direction="vertical" size={8} style={{ width: "100%", marginTop: 8 }}>
          <Typography.Text type="secondary">
            Configure matrix node order using the same circular hierarchy logic.
          </Typography.Text>

          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {atlas.matrixHierarchyFields.map((field, index) => (
              <div key={field} className="atlas-panel__field-row">
                <Typography.Text strong>{humanizeFieldName(field)}</Typography.Text>
                <Space>
                  <Button
                    size="small"
                    icon={<ArrowUpOutlined />}
                    onClick={() =>
                      dispatch(
                        setMatrixHierarchyFields(
                          moveField(atlas.matrixHierarchyFields, field, "up"),
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
                        setMatrixHierarchyFields(
                          moveField(atlas.matrixHierarchyFields, field, "down"),
                        ),
                      )
                    }
                    disabled={index === atlas.matrixHierarchyFields.length - 1}
                    aria-label={`Move ${humanizeFieldName(field)} down`}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() =>
                      dispatch(
                        setMatrixHierarchyFields(
                          atlas.matrixHierarchyFields.filter((value) => value !== field),
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
            placeholder="Add matrix hierarchy field"
            style={{ width: "100%" }}
            options={selectableMatrixHierarchyFields.map((field) => ({
              value: field,
              label: humanizeFieldName(field),
            }))}
            value={undefined}
            onChange={(value) => {
              const field = String(value);
              dispatch(setMatrixHierarchyFields([...atlas.matrixHierarchyFields, field]));
            }}
          />

          <Button
            size="small"
            onClick={() =>
              dispatch(setMatrixHierarchyFields(reverseValues(atlas.matrixHierarchyFields)))
            }
            disabled={atlas.matrixHierarchyFields.length < 2}
          >
            Invert hierarchy order
          </Button>

          {atlas.matrixHierarchyFields.length === 0 ? (
            <Typography.Text type="secondary">
              No hierarchy fields selected. Matrix order uses the default node order.
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary">
              Active hierarchy: {atlas.matrixHierarchyFields.map(humanizeFieldName).join(" → ")}
            </Typography.Text>
          )}

          {matrixCategoryOrderEditors.length > 0 && (
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Typography.Text strong>Category order per branch</Typography.Text>
              {matrixCategoryOrderEditors.map((editor) => {
                const parentDescription =
                  editor.parentValues.length === 0
                    ? "Root level"
                    : editor.parentValues
                        .map((value, index) => {
                          const parentField = atlas.matrixHierarchyFields[index] ?? "";
                          return `${humanizeFieldName(parentField)}: ${value}`;
                        })
                        .join(" · ");
                return (
                  <div
                    key={editor.key}
                    style={{
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      padding: 8,
                      background: "var(--color-surface)",
                    }}
                  >
                    <Typography.Text strong>
                      {humanizeFieldName(editor.field)}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ display: "block" }}>
                      {parentDescription}
                    </Typography.Text>
                    <Button
                      size="small"
                      style={{ marginTop: 6 }}
                      onClick={() => {
                        const next = {
                          ...atlas.matrixHierarchyCategoryOrder,
                          [editor.key]: reverseValues(editor.values),
                        };
                        dispatch(setMatrixHierarchyCategoryOrder(next));
                      }}
                      disabled={editor.values.length < 2}
                    >
                      Invert branch order
                    </Button>
                    <Space
                      direction="vertical"
                      size={6}
                      style={{ width: "100%", marginTop: 6 }}
                    >
                      {editor.values.map((value, index) => (
                        <div key={value} className="atlas-panel__field-row">
                          <Typography.Text>{value}</Typography.Text>
                          <Space>
                            <Button
                              size="small"
                              icon={<ArrowUpOutlined />}
                              onClick={() => {
                                const next = {
                                  ...atlas.matrixHierarchyCategoryOrder,
                                  [editor.key]: moveValue(editor.values, value, "up"),
                                };
                                dispatch(setMatrixHierarchyCategoryOrder(next));
                              }}
                              disabled={index === 0}
                              aria-label={`Move ${value} up`}
                            />
                            <Button
                              size="small"
                              icon={<ArrowDownOutlined />}
                              onClick={() => {
                                const next = {
                                  ...atlas.matrixHierarchyCategoryOrder,
                                  [editor.key]: moveValue(editor.values, value, "down"),
                                };
                                dispatch(setMatrixHierarchyCategoryOrder(next));
                              }}
                              disabled={index === editor.values.length - 1}
                              aria-label={`Move ${value} down`}
                            />
                          </Space>
                        </div>
                      ))}
                    </Space>
                  </div>
                );
              })}
            </Space>
          )}

          <div
            style={{
              width: PREVIEW_SIZE,
              maxWidth: "100%",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              borderRadius: 8,
              padding: 8,
            }}
          >
            <Typography.Text type="secondary">Matrix X-axis preview</Typography.Text>
            <svg width={PREVIEW_SIZE} height={MATRIX_PREVIEW_HEIGHT} style={{ display: "block" }}>
              <line
                x1={PREVIEW_PADDING}
                x2={PREVIEW_SIZE - PREVIEW_PADDING}
                y1={MATRIX_PREVIEW_HEIGHT / 2}
                y2={MATRIX_PREVIEW_HEIGHT / 2}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              {matrixPreviewIds.map((id, index) => {
                const innerWidth = PREVIEW_SIZE - PREVIEW_PADDING * 2;
                const total = Math.max(matrixPreviewIds.length, 1);
                const gap = 1.5;
                const slotWidth = innerWidth / total;
                const rectWidth = Math.max(1, slotWidth - gap);
                const rectHeight = 10;
                const x = PREVIEW_PADDING + index * slotWidth + (slotWidth - rectWidth) / 2;
                const y = MATRIX_PREVIEW_HEIGHT / 2 - rectHeight / 2;
                return (
                  <rect
                    key={id}
                    x={x}
                    y={y}
                    width={rectWidth}
                    height={rectHeight}
                    rx={1}
                    fill={previewNodeColors[id] ?? "var(--color-primary)"}
                  >
                    <title>{id}</title>
                  </rect>
                );
              })}
            </svg>
            <Typography.Text type="secondary">
              Showing {matrixPreviewIds.length} / {activeRoiIds.length} ROIs
            </Typography.Text>
          </div>
        </Space>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Populations</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(data.catalogs.populations).map((population) => (
            <Card key={population.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Population label"
                    value={population.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      updateItem("populations", population.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(population)}
                    onChange={(checked) =>
                      updateItem("populations", population.id, {
                        enabled: checked,
                      })
                    }
                  />
                  <Typography.Text type="secondary">
                    ID: {population.id}
                  </Typography.Text>
                </Space>
                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={population.description ?? ""}
                  onChange={(event) =>
                    updateItem("populations", population.id, {
                      description: event.target.value,
                    })
                  }
                  style={{ resize: "vertical" }}
                />
              </Space>
            </Card>
          ))}
        </div>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Measures</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(data.catalogs.measures).map((measure) => (
            <Card key={measure.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Measure label"
                    value={measure.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      updateItem("measures", measure.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(measure)}
                    onChange={(checked) =>
                      updateItem("measures", measure.id, { enabled: checked })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Min"
                    value={measure.min ?? null}
                    onChange={(value) =>
                      updateItem("measures", measure.id, {
                        min: normalizeNumber(value),
                      })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Max"
                    value={measure.max ?? null}
                    onChange={(value) =>
                      updateItem("measures", measure.id, {
                        max: normalizeNumber(value),
                      })
                    }
                  />
                  <Typography.Text type="secondary">
                    ID: {measure.id}
                  </Typography.Text>
                </Space>
                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={measure.description ?? ""}
                  onChange={(event) =>
                    updateItem("measures", measure.id, {
                      description: event.target.value,
                    })
                  }
                  style={{ resize: "vertical" }}
                />
              </Space>
            </Card>
          ))}
        </div>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Statistics</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(data.catalogs.stats).map((stat) => (
            <Card key={stat.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={8} align="start">
                  <Input
                    size="small"
                    placeholder="Statistic label"
                    value={stat.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      updateItem("stats", stat.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(stat)}
                    onChange={(checked) =>
                      updateItem("stats", stat.id, { enabled: checked })
                    }
                  />
                  <Space size={4}>
                    <Switch
                      checked={stat.useDataRange === true}
                      onChange={(checked) =>
                        updateItem("stats", stat.id, { useDataRange: checked })
                      }
                    />
                    <Typography.Text type="secondary">Use data range</Typography.Text>
                  </Space>
                  <InputNumber
                    size="small"
                    placeholder="Min"
                    value={stat.min ?? null}
                    onChange={(value) =>
                      updateItem("stats", stat.id, {
                        min: normalizeNumber(value),
                      })
                    }
                  />
                  <InputNumber
                    size="small"
                    placeholder="Max"
                    value={stat.max ?? null}
                    onChange={(value) =>
                      updateItem("stats", stat.id, {
                        max: normalizeNumber(value),
                      })
                    }
                  />
                  <Typography.Text type="secondary">
                    ID: {stat.id}
                  </Typography.Text>
                </Space>
                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={stat.description ?? ""}
                  onChange={(event) =>
                    updateItem("stats", stat.id, {
                      description: event.target.value,
                    })
                  }
                  style={{ resize: "vertical" }}
                />
              </Space>
            </Card>
          ))}
        </div>
      </div>

      <Divider style={{ margin: "8px 0" }} />

      <div>
        <Typography.Text strong>Bands</Typography.Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {Object.values(data.catalogs.bands).map((band) => (
            <Card key={band.id} size="small" style={{ width: 300 }}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Space wrap size={12} align="start">
                  <Input
                    size="small"
                    placeholder="Band label"
                    value={band.label ?? ""}
                    style={{ width: 160 }}
                    onChange={(event) =>
                      updateItem("bands", band.id, {
                        label: event.target.value,
                      })
                    }
                  />
                  <Switch
                    checked={isEnabled(band)}
                    onChange={(checked) =>
                      updateItem("bands", band.id, { enabled: checked })
                    }
                  />
                  <Typography.Text type="secondary">
                    Frequency range: {band.min}–{band.max} Hz
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    ID: {band.id}
                  </Typography.Text>
                </Space>
                <Input.TextArea
                  size="small"
                  placeholder="Description"
                  value={band.description ?? ""}
                  onChange={(event) =>
                    updateItem("bands", band.id, {
                      description: event.target.value,
                    })
                  }
                  style={{ resize: "vertical" }}
                />
              </Space>
            </Card>
          ))}
        </div>
      </div>
    </Space>
  );
}

export default DatasetManagement;
