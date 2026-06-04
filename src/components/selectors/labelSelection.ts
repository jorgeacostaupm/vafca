import type { ZoomSelection } from "@/types/networkVisualization";
import { intersectLabels } from "@/utils/matrixViewUtils";

export const buildLabelState = ({
  matrixOrderIds,
  atlasOrderLength,
  activeLabelIds,
  labels,
  zoomLabelSelection,
  zoomSelection,
}: {
  matrixOrderIds: string[];
  atlasOrderLength: number;
  activeLabelIds: string[];
  labels?: string[];
  zoomLabelSelection?: string[];
  zoomSelection: ZoomSelection;
}) => {
  const orderedLabels = matrixOrderIds.length > 0 ? matrixOrderIds : undefined;
  const globalLabelSelection =
    orderedLabels && atlasOrderLength > 0 ? activeLabelIds : orderedLabels;

  const combinedBaseSelection = orderedLabels
    ? labels
      ? intersectLabels(globalLabelSelection ?? orderedLabels, labels, undefined)
      : globalLabelSelection
    : undefined;

  const rowLabelSelection =
    orderedLabels && (combinedBaseSelection || zoomSelection?.rows)
      ? intersectLabels(
          combinedBaseSelection ?? orderedLabels,
          zoomSelection?.rows,
          undefined,
        )
      : undefined;

  const colLabelSelection =
    orderedLabels && (combinedBaseSelection || zoomSelection?.cols)
      ? intersectLabels(
          combinedBaseSelection ?? orderedLabels,
          zoomSelection?.cols,
          undefined,
        )
      : undefined;

  const availableLabels = orderedLabels
    ? atlasOrderLength > 0
      ? activeLabelIds
      : orderedLabels
    : [];

  const selectedLabels = labels
    ? labels.filter((id) => availableLabels.includes(id))
    : availableLabels;

  const activeZoomSelection = zoomLabelSelection
    ? zoomLabelSelection.filter((id) => availableLabels.includes(id))
    : [];

  const orderedZoomLabels =
    availableLabels.length > 0 && activeZoomSelection.length > 0
      ? availableLabels.filter((label) => activeZoomSelection.includes(label))
      : activeZoomSelection;

  return {
    labels: orderedLabels,
    rowLabelSelection,
    colLabelSelection,
    availableLabels,
    selectedLabels,
    zoomLabelSelection: activeZoomSelection,
    orderedZoomLabels,
  };
};
