import { applyLinkMask, applyNodeMask } from "@/components/network/networkFormatting";
import { toRenderDataByViewType } from "@/components/network/networkViewRenderData";
import type { NetworkViewValueFilters } from "@/types/networkViews";
import type { ComputedView, NetworkViewType } from "@/types/networkVisualization";
import { filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";

type AllowedSet = Set<string> | null;

const getZoomAllowedLinkIds = (computed: ComputedView): AllowedSet =>
  computed.zoomState.current?.linkIds
    ? new Set(computed.zoomState.current.linkIds)
    : null;

const buildMaskedMatrixData = ({
  computed,
  valueFilters,
  allowedNodeIds,
  allowedLinkIds,
  zoomAllowedLinkIds,
}: {
  computed: ComputedView;
  valueFilters: NetworkViewValueFilters;
  allowedNodeIds: AllowedSet;
  allowedLinkIds: AllowedSet;
  zoomAllowedLinkIds: AllowedSet;
}) => {
  let maskedMatrix = computed.hideIsolatedNodes
    ? filterIsolatedMatrixEntries(
        computed.data,
        computed.rowLabels,
        computed.colLabels,
        valueFilters,
      )
    : {
        data: computed.data,
        rowLabels: computed.rowLabels,
        colLabels: computed.colLabels,
      };

  if (allowedNodeIds) {
    maskedMatrix = applyNodeMask({
      data: maskedMatrix.data,
      rowLabels: maskedMatrix.rowLabels ?? [],
      colLabels: maskedMatrix.colLabels ?? [],
      allowedNodeIds,
    });
  }

  if (allowedLinkIds) {
    maskedMatrix = {
      ...maskedMatrix,
      data: applyLinkMask({
        data: maskedMatrix.data,
        rowLabels: maskedMatrix.rowLabels ?? [],
        colLabels: maskedMatrix.colLabels ?? [],
        allowedLinkIds,
      }),
    };
  }

  if (zoomAllowedLinkIds) {
    maskedMatrix = {
      ...maskedMatrix,
      data: applyLinkMask({
        data: maskedMatrix.data,
        rowLabels: maskedMatrix.rowLabels ?? [],
        colLabels: maskedMatrix.colLabels ?? [],
        allowedLinkIds: zoomAllowedLinkIds,
        preserveDiagonal: false,
      }),
    };
  }

  if (computed.hideIsolatedNodes) {
    maskedMatrix = filterIsolatedMatrixEntries(
      maskedMatrix.data,
      maskedMatrix.rowLabels ?? [],
      maskedMatrix.colLabels ?? [],
      valueFilters,
    );
  }

  return maskedMatrix;
};

const buildMaskedNodeLinkData = ({
  computed,
  allowedNodeIds,
  allowedLinkIds,
  zoomAllowedLinkIds,
}: {
  computed: ComputedView;
  allowedNodeIds: AllowedSet;
  allowedLinkIds: AllowedSet;
  zoomAllowedLinkIds: AllowedSet;
}) => {
  let maskedNodeLink = {
    data: computed.data,
    rowLabels: computed.rowLabels,
  };

  if (allowedNodeIds) {
    const byNodes = applyNodeMask({
      data: maskedNodeLink.data,
      rowLabels: maskedNodeLink.rowLabels,
      colLabels: maskedNodeLink.rowLabels,
      allowedNodeIds,
    });
    maskedNodeLink = {
      data: byNodes.data,
      rowLabels: byNodes.rowLabels ?? [],
    };
  }

  if (allowedLinkIds) {
    maskedNodeLink = {
      ...maskedNodeLink,
      data: applyLinkMask({
        data: maskedNodeLink.data,
        rowLabels: maskedNodeLink.rowLabels,
        colLabels: maskedNodeLink.rowLabels,
        allowedLinkIds,
      }),
    };
  }

  if (zoomAllowedLinkIds) {
    maskedNodeLink = {
      ...maskedNodeLink,
      data: applyLinkMask({
        data: maskedNodeLink.data,
        rowLabels: maskedNodeLink.rowLabels,
        colLabels: maskedNodeLink.rowLabels,
        allowedLinkIds: zoomAllowedLinkIds,
        preserveDiagonal: false,
      }),
    };
  }

  return maskedNodeLink;
};

export const buildNetworkViewRenderData = ({
  viewType,
  computed,
  valueFilters,
  allowedNodeIds,
  allowedLinkIds,
}: {
  viewType: NetworkViewType;
  computed: ComputedView;
  valueFilters: NetworkViewValueFilters;
  allowedNodeIds: AllowedSet;
  allowedLinkIds: AllowedSet;
}) => {
  const zoomAllowedLinkIds = getZoomAllowedLinkIds(computed);

  if (viewType === "matrix") {
    const maskedMatrix = buildMaskedMatrixData({
      computed,
      valueFilters,
      allowedNodeIds,
      allowedLinkIds,
      zoomAllowedLinkIds,
    });
    return toRenderDataByViewType("matrix", {
      data: maskedMatrix.data,
      rowLabels: maskedMatrix.rowLabels ?? [],
      colLabels: maskedMatrix.colLabels ?? [],
    });
  }

  const maskedNodeLink = buildMaskedNodeLinkData({
    computed,
    allowedNodeIds,
    allowedLinkIds,
    zoomAllowedLinkIds,
  });
  return toRenderDataByViewType(viewType, {
    data: maskedNodeLink.data,
    rowLabels: maskedNodeLink.rowLabels ?? [],
    colLabels: maskedNodeLink.rowLabels ?? [],
  });
};
