import {
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  SelectOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "@/store/hooks";
import { useMatrixSummaries } from "@/hooks/useMatrixSummaries";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { getMatrix } from "@/utils/matrixStore";
import {
  filterIsolatedMatrixEntries,
  type MatrixValueRange,
  filterMatrixByLabels,
} from "@/utils/matrixFiltering";
import {
  buildDefaultStatRanges,
  getLegendRange,
  buildMatrixLabel,
} from "@/utils/matrixViewUtils";
import PanelGridLayout from "@/components/layout/PanelGridLayout";
import usePanelLayout from "@/components/layout/usePanelLayout";
import MatrixHeatmapPanel from "@/components/matrix/MatrixHeatmapPanel";
import MatrixSelectorControls from "@/components/matrix/MatrixSelectorControls";
import ChartDownloadButton from "@/components/common/ChartDownloadButton";
import { useMatrixFilterOptions } from "@/components/selectors/useMatrixFilterOptions";
import { buildLabelState } from "@/components/selectors/labelSelection";
import {
  getZoomState,
  useViewSettingsState,
  type ZoomableViewSettings,
} from "@/components/selectors/useViewSettingsState";

type View = {
  compoundId: string;
  label: string;
  data: number[][];
  measureId: string;
  statId: string;
};

type MatrixViewSettings = ZoomableViewSettings & {
  labels?: string[];
  measureRange?: [number, number];
  brushEnabled?: boolean;
  hideIsolatedNodes?: boolean;
};
const applyLabelFilter = filterMatrixByLabels;
const toMatrixStatFilter = (
  statRange: MatrixViewSettings["statRange"],
): MatrixValueRange => {
  if (!statRange) return null;
  if (Array.isArray(statRange)) {
    return typeof statRange[0] === "number" && typeof statRange[1] === "number"
      ? ([statRange[0], statRange[1]] as [number, number])
      : null;
  }
  return [statRange.negative, statRange.positive] as Array<[number, number]>;
};

function MatrixSelector() {
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
    defaultW: 8,
    defaultH: 5,
    columns: 3,
  });

  const [populationKey, setPopulationKey] = useState("");
  const [measureId, setMeasureId] = useState("");
  const [statId, setStatId] = useState("");
  const [bandId, setBandId] = useState("");
  const [selectedCompoundId, setSelectedCompoundId] = useState("");
  const [syncZoom, setSyncZoom] = useState(false);
  const [matrixSettings, setMatrixSettings] = useState<
    Record<string, MatrixViewSettings>
  >({});
  const svgRefs = useRef<Record<string, RefObject<SVGSVGElement>>>({});
  const getSvgRef = (id: string) => {
    if (!svgRefs.current[id]) {
      svgRefs.current[id] = createRef<SVGSVGElement>() as RefObject<SVGSVGElement>;
    }
    return svgRefs.current[id];
  };

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
    atlasDefinition,
    useMatrixHierarchyOrder: true,
  });

  const defaultStatRanges = useMemo(
    () => buildDefaultStatRanges(dataset?.catalogs.stats),
    [dataset],
  );

  useEffect(() => {
    if (matches.length === 1) {
      setSelectedCompoundId(matches[0].compoundId);
    } else {
      setSelectedCompoundId("");
    }
  }, [matches]);

  const {
    patchSettings: updateMatrixSettings,
    resetSettings: resetMatrixSettings,
    applyZoom,
    toggleZoomLabelSelection,
    resetZoomLabelSelection,
    stepZoomHistory,
  } = useViewSettingsState<MatrixViewSettings>({
    syncZoom,
    getTargetIds: () => views.map((view) => view.compoundId),
    setSettings: setMatrixSettings,
    defaultStatRanges,
  });

  const handleAddMatrix = async () => {
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

  const handleRemoveMatrix = (compoundId: string) => {
    setViews((prev) => prev.filter((item) => item.compoundId !== compoundId));
    removePanel(compoundId);
    resetMatrixSettings(compoundId);
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
          <MatrixSelectorControls
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
            disabled={{
              measures: !populationKey,
              stats: !measureId,
              bands: !statId,
            }}
            showMatrixSelect={matches.length > 1}
            syncZoom={syncZoom}
            onToggleSyncZoom={setSyncZoom}
            onChange={{
              populations: (value) => {
                setPopulationKey(value ?? "");
                setMeasureId("");
                setStatId("");
                setBandId("");
              },
              measure: (value) => {
                setMeasureId(value ?? "");
                setStatId("");
                setBandId("");
              },
              stat: (value) => {
                setStatId(value ?? "");
                setBandId("");
              },
              band: (value) => setBandId(value ?? ""),
              matrix: (value) => setSelectedCompoundId(value ?? ""),
            }}
            onAdd={handleAddMatrix}
          />
        </div>
      </Col>
      <Col xs={24} lg={20}>
        <PanelGridLayout
          items={views.map((matrix) => {
            const svgRef = getSvgRef(matrix.compoundId);
            const range = getLegendRange(
              matrix.data,
              matrix.measureId,
              matrix.statId,
              dataset?.catalogs,
            );
            const settings = matrixSettings[matrix.compoundId];
            const statRange = settings?.statRange;
            const statFilter = toMatrixStatFilter(statRange);
            const measureRange = settings?.measureRange ?? null;
            const hideIsolatedNodes = settings?.hideIsolatedNodes ?? true;
            const currentValueFilters = {
              measure: measureRange ?? null,
              stat: statFilter,
            };
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
            const {
              data: filteredData,
              rowLabels: filteredRowLabels,
              colLabels: filteredColLabels,
            } = applyLabelFilter(
              matrix.data,
              labels,
              rowLabelSelection,
              colLabelSelection,
              matrixShape,
            );
            const {
              data: visibleData,
              rowLabels: visibleRowLabels,
              colLabels: visibleColLabels,
            } = hideIsolatedNodes
              ? filterIsolatedMatrixEntries(
                  filteredData,
                  filteredRowLabels,
                  filteredColLabels,
                  currentValueFilters,
                )
              : {
                  data: filteredData,
                  rowLabels: filteredRowLabels,
                  colLabels: filteredColLabels,
                };
            const brushEnabled = settings?.brushEnabled ?? false;
            const canZoomBack = zoomState.index > 0;
            const canZoomForward =
              zoomState.index < zoomState.history.length - 1;
            const showAllLabels = Boolean(zoomSelection);
            const canZoomByLabels = orderedZoomLabels.length > 0;
            return {
              id: matrix.compoundId,
              title: matrix.label,
              actions: (
                <Space size={4}>
                  <ChartDownloadButton
                    svgRef={svgRef}
                    fileName={`Matrix ${matrix.label}`}
                  />
                  <Button
                    size="small"
                    type={brushEnabled ? "default" : "text"}
                    aria-label="Toggle brush zoom"
                    title="Brush zoom"
                    icon={<SelectOutlined />}
                    onClick={() =>
                      updateMatrixSettings(matrix.compoundId, {
                        brushEnabled: !brushEnabled,
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
                      applyZoom(matrix.compoundId, {
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
                    onClick={() => resetZoomLabelSelection(matrix.compoundId)}
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label="Zoom back"
                    title="Zoom back"
                    icon={<LeftOutlined />}
                    disabled={!canZoomBack}
                    onClick={() => stepZoomHistory(matrix.compoundId, -1)}
                  />
                  <Button
                    size="small"
                    type="text"
                    aria-label="Zoom forward"
                    title="Zoom forward"
                    icon={<RightOutlined />}
                    disabled={!canZoomForward}
                    onClick={() => stepZoomHistory(matrix.compoundId, 1)}
                  />
                </Space>
              ),
              content: (
                <MatrixHeatmapPanel
                  data={visibleData}
                  rowLabels={visibleRowLabels}
                  colLabels={visibleColLabels}
                  compoundId={matrix.compoundId}
                  matrixLabel={matrix.label}
                  labelNames={labelNames}
                  svgRef={svgRef}
                  matrixShape={matrixShape}
                  legendMin={range.min}
                  legendMax={range.max}
                  valueFilters={currentValueFilters}
                  brushEnabled={brushEnabled}
                  showAllLabels={showAllLabels}
                  selectedZoomLabels={zoomLabelSelection}
                  onLabelToggle={(label) =>
                    toggleZoomLabelSelection(
                      matrix.compoundId,
                      label,
                      availableLabels,
                    )
                  }
                  onBrushZoom={(payload) => {
                    if (payload.rowLabels.length === 0) return;
                    if (payload.colLabels.length === 0) return;
                    applyZoom(matrix.compoundId, {
                      rows: payload.rowLabels,
                      cols: payload.colLabels,
                    });
                  }}
                />
              ),
            };
          })}
          layout={layout}
          onRemove={handleRemoveMatrix}
          setLayout={setLayout}
        />
      </Col>
    </Row>
  );
}

export default MatrixSelector;
