import {
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type RefObject,
} from "react";
import {
  Button,
  Col,
  Row,
  Space,
  Typography,
} from "antd";
import {
  FullscreenOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  SelectOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@/store/hooks";
import { useMatrixSummaries } from "@/hooks/useMatrixSummaries";
import { getMatrix } from "@/utils/matrixStore";
import PanelGridLayout from "@/components/layout/PanelGridLayout";
import usePanelLayout from "@/components/layout/usePanelLayout";
import NodeLinkSelectorControls from "@/components/nodelink/NodeLinkSelectorControls";
import ChartDownloadButton from "@/components/common/ChartDownloadButton";
import { filterMatrixByLabels } from "@/utils/matrixFiltering";
import {
  DEFAULT_LINK_WIDTH_RANGE,
  buildMatrixLabel,
  buildDefaultStatRanges,
} from "@/utils/matrixViewUtils";
import { buildLabelState } from "@/components/selectors/labelSelection";
import {
  nodeLinkLabelFormatter,
  useMatrixFilterOptions,
} from "@/components/selectors/useMatrixFilterOptions";
import {
  getZoomState,
  useViewSettingsState,
  type ZoomableViewSettings,
} from "@/components/selectors/useViewSettingsState";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { buildAtlasRoiColorById } from "@/utils/atlas/coloring";
import type { AtlasDefinition } from "@/types/atlas";
import type { NodeLinkPanelCommonProps } from "@/components/nodelink/panelTypes";


type View = {
  compoundId: string;
  label: string;
  data: number[][];
  measureId: string;
  statId: string;
};

type NodeLinkViewSettings = ZoomableViewSettings & {
  labels?: string[];
  measureRange?: [number, number];
  linkWidthRange?: [number, number];
  brushEnabled?: boolean;
  geometricZoomEnabled?: boolean;
  hideIsolatedNodes?: boolean;
};

type NodeLinkPanelProps = NodeLinkPanelCommonProps & {
  atlasDefinition?: AtlasDefinition | null;
  circularHierarchyFields?: string[];
  circularHierarchyCategoryOrder?: Record<string, string[]>;
};

type NodeLinkSelectorBaseProps = {
  PanelComponent: ComponentType<NodeLinkPanelProps>;
  downloadPrefix: string;
};
const toNodeLinkStatFilter = (statRange: NodeLinkViewSettings["statRange"]) => {
  if (!statRange) return null;
  if (Array.isArray(statRange)) return statRange;
  return [statRange.negative, statRange.positive] as Array<[number, number]>;
};

function NodeLinkSelectorBase({
  PanelComponent,
  downloadPrefix,
}: NodeLinkSelectorBaseProps) {
  const dataset = useAppSelector((state) => state.dataset.data);
  const atlas = useAppSelector((state) => state.atlas);
  const matrixShape = useAppSelector((state) => state.visualizationUi.matrixShape);
  const atlasDefinition = useAtlasDefinition(
    dataset?.metadata.atlasId ?? dataset?.metadata.atlas,
  );
  const { summaries, status, error } = useMatrixSummaries(
    dataset?.matrixStats.total,
  );
  const [views, setViews] = useState<View[]>([]);
  const { layout, setLayout, addPanel, removePanel } = usePanelLayout({
    defaultW: 4,
    defaultH: 5,
    columns: 3,
  });

  const [populationKey, setPopulationKey] = useState("");
  const [measureId, setMeasureId] = useState("");
  const [statId, setStatId] = useState("");
  const [bandId, setBandId] = useState("");
  const [selectedCompoundId, setSelectedCompoundId] = useState("");
  const [syncZoom, setSyncZoom] = useState(false);
  const [viewSettings, setViewSettings] = useState<
    Record<string, NodeLinkViewSettings>
  >({});
  const svgRefs = useRef<Record<string, RefObject<SVGSVGElement>>>({});
  const getSvgRef = (id: string) => {
    if (!svgRefs.current[id]) {
      svgRefs.current[id] = createRef<SVGSVGElement>() as RefObject<SVGSVGElement>;
    }
    return svgRefs.current[id];
  };

  const defaultStatRanges = useMemo(
    () =>
    buildDefaultStatRanges(dataset?.catalogs.stats),
    [dataset],
  );
  const nodeColors = useMemo(
    () =>
      buildAtlasRoiColorById({
        atlasDefinition,
        colorFields: atlas.colorFields,
        colorPalette: atlas.colorPalette,
      }),
    [atlas.colorFields, atlas.colorPalette, atlasDefinition],
  );
  const labelTitles = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.label ?? id;
        return acc;
      }, {}),
    [atlas.order, atlas.labelsById],
  );
  const labelAcronyms = useMemo(
    () =>
      atlas.order.reduce<Record<string, string>>((acc, id) => {
        const meta = atlas.labelsById[id];
        if (!meta) return acc;
        acc[id] = meta.acronym?.trim() ? meta.acronym : id;
        return acc;
      }, {}),
    [atlas.order, atlas.labelsById],
  );

  const {
    matrixOrderIds,
    labelNames,
    activeLabelIds,
    populationOptions,
    measures,
    statOptions,
    bandOptions,
    matches,
    matrixOptions,
  } = useMatrixFilterOptions({
    dataset,
    atlas,
    summaries,
    populationKey,
    measureId,
    statId,
    bandId,
    labelFormatter: nodeLinkLabelFormatter,
  });

  useEffect(() => {
    if (matches.length === 1) {
      setSelectedCompoundId(matches[0].compoundId);
    } else {
      setSelectedCompoundId("");
    }
  }, [matches]);

  const {
    patchSettings,
    resetSettings,
    applyZoom,
    toggleZoomLabelSelection,
    resetZoomLabelSelection,
    stepZoomHistory,
  } =
    useViewSettingsState<NodeLinkViewSettings>({
      syncZoom,
      getTargetIds: () => views.map((view) => view.compoundId),
      setSettings: setViewSettings,
      defaultStatRanges,
    });

  const handleChange = {
    populations: (value?: string) => {
      setPopulationKey(value ?? "");
      setMeasureId("");
      setStatId("");
      setBandId("");
    },
    measure: (value?: string) => {
      setMeasureId(value ?? "");
      setStatId("");
      setBandId("");
    },
    stat: (value?: string) => {
      setStatId(value ?? "");
      setBandId("");
    },
    band: (value?: string) => setBandId(value ?? ""),
    matrix: (value?: string) => setSelectedCompoundId(value ?? ""),
  };

  const controlsDisabled = {
    measures: !populationKey,
    stats: !measureId,
    bands: !statId,
  };

  const updateViewSettings = patchSettings;
  const resetViewSettings = resetSettings;
  const stepViewZoomHistory = stepZoomHistory;
  const applyViewZoom = applyZoom;
  const resetViewZoomLabelSelection = resetZoomLabelSelection;
  const toggleViewZoomLabelSelection = toggleZoomLabelSelection;

  const handleAddView = async () => {
    if (!selectedCompoundId) return;
    if (views.some((item) => item.compoundId === selectedCompoundId)) return;
    const matrix = await getMatrix(selectedCompoundId);
    if (matrix) {
      setViews((prev) => [
        ...prev,
        {
          compoundId: selectedCompoundId,
          label: buildMatrixLabel(matrix, dataset?.catalogs),
          data: matrix.data,
          measureId: matrix.measureId,
          statId: matrix.statId,
        },
      ]);
      addPanel(selectedCompoundId);
    }
  };

  const handleRemoveView = (compoundId: string) => {
    setViews((prev) => prev.filter((item) => item.compoundId !== compoundId));
    removePanel(compoundId);
    resetViewSettings(compoundId);
  };

  if (status === "loading") {
    return <Typography.Text>Loading matrix list…</Typography.Text>;
  }

  if (status === "error") {
    return <Typography.Text type="danger">Error: {error}</Typography.Text>;
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={4}>
        <div className="matrix-sidebar">
          <NodeLinkSelectorControls
            measures={measures}
            populations={populationOptions}
            bands={bandOptions}
            stats={statOptions}
            matrices={matrixOptions}
            selection={{
              populationKey,
              measureId,
              statId,
              bandId,
              compoundId: selectedCompoundId,
            }}
            disabled={controlsDisabled}
            showMatrixSelect={matches.length > 1}
            syncZoom={syncZoom}
            onToggleSyncZoom={setSyncZoom}
            onChange={handleChange}
            onAdd={handleAddView}
          />
        </div>
      </Col>
      <Col xs={24} lg={20}>
        <PanelGridLayout
          items={views.map((view) => {
            const svgRef = getSvgRef(view.compoundId);
            const settings = viewSettings[view.compoundId];
            const statRange = settings?.statRange;
            const statFilter = toNodeLinkStatFilter(statRange);
            const measureRange = settings?.measureRange ?? null;
            const zoomState = getZoomState(settings);
            const zoomSelection = zoomState.current;
            const {
              labels,
              rowLabelSelection,
              colLabelSelection,
              availableLabels,
              zoomLabelSelection,
              orderedZoomLabels,
            } = buildLabelState({
              matrixOrderIds,
              atlasOrderLength: atlas.order.length,
              activeLabelIds,
              labels: settings?.labels,
              zoomLabelSelection: settings?.zoomLabelSelection,
              zoomSelection,
            });
            const { data, rowLabels: filteredRowLabels } = filterMatrixByLabels(
              view.data,
              labels,
              rowLabelSelection,
              colLabelSelection,
              matrixShape,
            );
            const canZoomByLabels = orderedZoomLabels.length > 0;
            const canZoomBack = zoomState.index > 0;
            const canZoomForward =
              zoomState.index < zoomState.history.length - 1;
            const stat = dataset?.catalogs.stats[view.statId];
            const statMin = Number.isFinite(stat?.min)
              ? (stat?.min as number)
              : -1;
            const statMax = Number.isFinite(stat?.max)
              ? (stat?.max as number)
              : 1;
            const [statSliderMin, statSliderMax] =
              statMin <= statMax ? [statMin, statMax] : [statMax, statMin];
            const hasNegativeRange = statSliderMin < 0 && statSliderMax > 0;
            const linkWidthRange =
              settings?.linkWidthRange ?? DEFAULT_LINK_WIDTH_RANGE;
            const brushEnabled = settings?.brushEnabled ?? false;
            const geometricZoomEnabled =
              settings?.geometricZoomEnabled ?? false;
            const hideIsolatedNodes = settings?.hideIsolatedNodes ?? true;
            return {
              id: view.compoundId,
              title: view.label,
              actions: (
                <Space size={4}>
                  <ChartDownloadButton
                    svgRef={svgRef}
                    fileName={`${downloadPrefix} ${view.label}`}
                  />
                  <Button
                    size="small"
                    type={brushEnabled ? "default" : "text"}
                    aria-label="Toggle brush zoom"
                    title="Brush zoom"
                    icon={<SelectOutlined />}
                    onClick={() =>
                      updateViewSettings(view.compoundId, {
                        brushEnabled: !brushEnabled,
                      })
                    }
                  />
                  <Button
                    size="small"
                    type={geometricZoomEnabled ? "default" : "text"}
                    aria-label="Toggle geometric zoom"
                    title="Geometric zoom"
                    icon={<FullscreenOutlined />}
                    onClick={() =>
                      updateViewSettings(view.compoundId, {
                        geometricZoomEnabled: !geometricZoomEnabled,
                      })
                    }
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label="Zoom to labels"
                    title="Zoom to labels"
                    icon={<ZoomInOutlined />}
                    disabled={!canZoomByLabels}
                    onClick={() => {
                      if (!canZoomByLabels) return;
                      applyViewZoom(view.compoundId, {
                        rows: orderedZoomLabels,
                        cols: orderedZoomLabels,
                      });
                    }}
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label="Clear node selection"
                    title="Clear node selection"
                    icon={<ReloadOutlined />}
                    disabled={zoomLabelSelection.length === 0}
                    onClick={() => resetViewZoomLabelSelection(view.compoundId)}
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label="Zoom back"
                    title="Zoom back"
                    icon={<LeftOutlined />}
                    disabled={!canZoomBack}
                    onClick={() => stepViewZoomHistory(view.compoundId, -1)}
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label="Zoom forward"
                    title="Zoom forward"
                    icon={<RightOutlined />}
                    disabled={!canZoomForward}
                    onClick={() => stepViewZoomHistory(view.compoundId, 1)}
                  />
                </Space>
              ),
              content: (
                <PanelComponent
                  data={data}
                  labels={filteredRowLabels}
                  labelNames={labelNames}
                  labelTitles={labelTitles}
                  labelAcronyms={labelAcronyms}
                  nodeColors={nodeColors}
                  compoundId={view.compoundId}
                  matrixLabel={view.label}
                  svgRef={svgRef}
                  valueFilters={{
                    measure: measureRange ?? null,
                    stat: statFilter,
                  }}
                  selectedZoomLabels={zoomLabelSelection}
                  linkWidthRange={linkWidthRange}
                  brushEnabled={brushEnabled}
                  geometricZoomEnabled={geometricZoomEnabled}
                  hideIsolatedNodes={hideIsolatedNodes}
                  diverging={Boolean(hasNegativeRange)}
                  atlasDefinition={atlasDefinition}
                  circularHierarchyFields={atlas.circularHierarchyFields}
                  circularHierarchyCategoryOrder={atlas.circularHierarchyCategoryOrder}
                  onLabelToggle={(label) =>
                    toggleViewZoomLabelSelection(
                      view.compoundId,
                      label,
                      availableLabels,
                    )
                  }
                  onBrushZoom={(payload) => {
                    if (payload.labels.length === 0) return;
                    applyViewZoom(view.compoundId, {
                      rows: payload.labels,
                      cols: payload.labels,
                    });
                  }}
                />
              ),
            };
          })}
          layout={layout}
          onRemove={handleRemoveView}
          setLayout={setLayout}
        />
      </Col>
    </Row>
  );
}

export default NodeLinkSelectorBase;
