import { intersectLabels } from "@/utils/matrixViewUtils";
import type { ZoomSelection } from "@/types/networkVisualization";

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
      ? intersectLabels(orderedLabels, globalLabelSelection, labels)
      : globalLabelSelection
    : undefined;

  const rowLabelSelection =
    orderedLabels && (combinedBaseSelection || zoomSelection?.rows)
      ? intersectLabels(orderedLabels, combinedBaseSelection, zoomSelection?.rows)
      : undefined;

  const colLabelSelection =
    orderedLabels && (combinedBaseSelection || zoomSelection?.cols)
      ? intersectLabels(orderedLabels, combinedBaseSelection, zoomSelection?.cols)
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
