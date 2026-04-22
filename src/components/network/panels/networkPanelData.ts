import { adaptDataByViewType } from "@/components/network/networkViewAdapters";
import { applyLinkMask, applyNodeMask } from "@/components/network/networkFormatting";
import { filterIsolatedMatrixEntries } from "@/utils/matrixFiltering";
import type { ComputedView, NetworkViewType } from "@/types/networkVisualization";
import type { NetworkPanelValueFilters } from "@/types/networkPanels";

type AllowedSet = Set<string> | null;


export const buildPanelValueFilters = (
  computed: ComputedView,
): NetworkPanelValueFilters => ({
  measure: null,
  stat: computed.statFilter,
});

const buildMaskedMatrixData = ({
  computed,
  valueFilters,
  allowedNodeIds,
  allowedLinkIds,
}: {
  computed: ComputedView;
  valueFilters: NetworkPanelValueFilters;
  allowedNodeIds: AllowedSet;
  allowedLinkIds: AllowedSet;
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
}: {
  computed: ComputedView;
  allowedNodeIds: AllowedSet;
  allowedLinkIds: AllowedSet;
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

  return maskedNodeLink;
};

export const buildAdaptedNetworkPanelData = ({
  viewType,
  computed,
  valueFilters,
  allowedNodeIds,
  allowedLinkIds,
}: {
  viewType: NetworkViewType;
  computed: ComputedView;
  valueFilters: NetworkPanelValueFilters;
  allowedNodeIds: AllowedSet;
  allowedLinkIds: AllowedSet;
}) => {
  if (viewType === "matrix") {
    const maskedMatrix = buildMaskedMatrixData({
      computed,
      valueFilters,
      allowedNodeIds,
      allowedLinkIds,
    });
    return adaptDataByViewType("matrix", {
      data: maskedMatrix.data,
      rowLabels: maskedMatrix.rowLabels ?? [],
      colLabels: maskedMatrix.colLabels ?? [],
    });
  }

  const maskedNodeLink = buildMaskedNodeLinkData({
    computed,
    allowedNodeIds,
    allowedLinkIds,
  });
  return adaptDataByViewType(viewType, {
    data: maskedNodeLink.data,
    rowLabels: maskedNodeLink.rowLabels ?? [],
    colLabels: maskedNodeLink.rowLabels ?? [],
  });
};
