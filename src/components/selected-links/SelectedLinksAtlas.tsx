import { Alert } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import NetworkSpatialControls from "@/components/network/views/NetworkSpatialControls";
import SelectedLinksViewFrame from "@/components/selected-links/SelectedLinksViewFrame";
import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import { selectAtlasDisplayLabelsById, selectAtlasOrder } from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import { selectAtlasLinkIds } from '@/store/slices/visualizationUi/annotationSelectors';
import { selectCurrentAnnotation } from '@/store/slices/visualizationUi/annotationSelectors';
import { selectSelectedLinks } from '@/store/slices/visualizationUi/annotationSelectors';
import type { SelectedLink } from "@/types/visualizationUi";
import { atlasSupports3d } from "@/utils/atlas/atlasDefinition";
import { getDatasetAtlasId } from "@/utils/datasetAccessors";

import { LinksAtlasFocusControls } from "./LinksAtlasFocusControls";
import type { SelectedLinksFallbackNodeMode } from "./selectedLinksFallbackGraph";
import type { SelectedLinksFallbackViewType } from "./SelectedLinksFallbackView";
import SelectedLinksFallbackView from "./SelectedLinksFallbackView";
import { useLinksAtlasFocus } from "./useLinksAtlasFocus";
import { useLinksAtlasScene } from "./useLinksAtlasScene";

type SelectedLinksAtlasProps = {
  networkLinks?: SelectedLink[];
  networkDiverging?: boolean;
  controlsContainer?: HTMLDivElement | null;
  viewType: SelectedLinksFallbackViewType;
  nodeMode: SelectedLinksFallbackNodeMode;
  useAtlas3d: boolean;
  onViewTypeChange: (value: SelectedLinksFallbackViewType) => void;
  onNodeModeChange: (value: SelectedLinksFallbackNodeMode) => void;
};

export default function SelectedLinksAtlas({
  networkLinks,
  networkDiverging,
  controlsContainer,
  viewType,
  nodeMode,
  useAtlas3d,
  onViewTypeChange,
  onNodeModeChange,
}: SelectedLinksAtlasProps) {
  const isNetworkView = networkLinks !== undefined;
  const globalSpatialMode = useAppSelector(state => state.visualizationUi.atlasPanel.spatialMode);
  const [hideInactiveRois, setHideInactiveRois] = useState(false);
  const spatialMode = globalSpatialMode === "none" && !isNetworkView ? "none" : "geometry";
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const selectedLinks = useAppSelector(selectSelectedLinks);
  const atlasLinkIds = useAppSelector(selectAtlasLinkIds);
  const atlasNodeIds = useAppSelector(state => selectCurrentAnnotation(state).atlasNodeIds);
  const atlas3dAvailable = useAppSelector(
    (state) => state.visualizationUi.atlasPanel.is3dAvailable,
  );
  const atlasOrder = useAppSelector(selectAtlasOrder);
  const atlasLabelsById = useAppSelector(selectAtlasDisplayLabelsById);
  const atlasDefinition = useAtlasDefinition(getDatasetAtlasId(dataset));
  const deferredAtlasLinkIds = useDeferredValue(atlasLinkIds);
  const selectedLinkById = useMemo(
    () => new Map(selectedLinks.map((link) => [link.id, link] as const)),
    [selectedLinks],
  );

  const sourceLinks = useMemo(() => {
    if (networkLinks) return networkLinks;
    if (deferredAtlasLinkIds.length === 0) return [];
    return deferredAtlasLinkIds.flatMap((id) => {
      const link = selectedLinkById.get(id);
      return link ? [link] : [];
    });
  }, [deferredAtlasLinkIds, selectedLinkById, networkLinks]);
  const fallbackLinks = deferredAtlasLinkIds.length > 0 ? sourceLinks : selectedLinks;
  const focus = useLinksAtlasFocus(atlasDefinition, sourceLinks);
  const activeLinks = isNetworkView ? focus.links : sourceLinks;

  const highlightedNodeIds = useMemo(() => {
    const set = new Set<string>(isNetworkView ? [] : atlasNodeIds);
    activeLinks.forEach((link) => {
      set.add(link.rowId);
      set.add(link.colId);
    });
    return set;
  }, [activeLinks, atlasNodeIds, isNetworkView]);

  const hasLinkFocus = highlightedNodeIds.size > 0;
  const has3d = spatialMode !== "none" && useAtlas3d && (isNetworkView || atlas3dAvailable) && atlasSupports3d(atlasDefinition);
  const statusLabel = hasLinkFocus
    ? `Showing ${activeLinks.length} link${activeLinks.length === 1 ? "" : "s"} · ${highlightedNodeIds.size} Node${highlightedNodeIds.size === 1 ? "" : "s"}`
    : focus.isFiltered || networkLinks ? "No visible links" : "Select links to highlight them in the atlas";

  const { containerRef, applyCameraPose } = useLinksAtlasScene({
    atlasDefinition, has3d, spatialMode, isNetworkView, hideInactiveRois,
    highlightedNodeIds, activeLinks, networkDiverging,
  });

  if (!has3d || !atlasDefinition?.nodes?.length) {
    if (isNetworkView) return <Alert type="info" showIcon message="Load an atlas with 3D coordinates to use this view." />;
    return (
      <SelectedLinksFallbackView
        links={fallbackLinks}
        atlasOrder={atlasOrder}
        labelById={atlasLabelsById}
        viewType={viewType}
        nodeMode={nodeMode}
        onViewTypeChange={onViewTypeChange}
        onNodeModeChange={onNodeModeChange}
      />
    );
  }

  const controls = <NetworkSpatialControls
      hideInactiveRois={hideInactiveRois}
      onToggleInactiveRois={() => setHideInactiveRois(value => !value)}
      onCameraPose={applyCameraPose}
    >
      {isNetworkView && <LinksAtlasFocusControls focus={focus} />}
    </NetworkSpatialControls>;

  if (isNetworkView) return <>
    <div className="network-links-3d__canvas" ref={containerRef} role="img" aria-label={statusLabel} />
    {controlsContainer && createPortal(controls, controlsContainer)}
  </>;

  return <SelectedLinksViewFrame actions={controls}>
    <div className="links-atlas__canvas" ref={containerRef} role="img" aria-label={statusLabel} />
  </SelectedLinksViewFrame>;
}
