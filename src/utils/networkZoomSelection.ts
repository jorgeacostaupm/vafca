import type { ZoomSelection } from "@/types/networkVisualization";
import type { SelectedLink } from "@/types/visualizationUi";

export type NetworkZoomSelectionMode = "rois" | "links" | "union";

type BuildNetworkZoomSelectionArgs = {
  mode: NetworkZoomSelectionMode;
  selectedRoiIds: string[];
  selectedLinks: SelectedLink[];
  availableLabels: string[];
};

const addLabel = ({
  labels,
  label,
  allowedLabels,
}: {
  labels: Set<string>;
  label: string;
  allowedLabels: Set<string> | null;
}) => {
  if (allowedLabels && !allowedLabels.has(label)) return;
  labels.add(label);
};

export const buildNetworkZoomSelection = ({
  mode,
  selectedRoiIds,
  selectedLinks,
  availableLabels,
}: BuildNetworkZoomSelectionArgs): ZoomSelection => {
  const labels = new Set<string>();
  const allowedLabels = availableLabels.length > 0 ? new Set(availableLabels) : null;

  if (mode === "rois" || mode === "union") {
    selectedRoiIds.forEach((label) => addLabel({ labels, label, allowedLabels }));
  }

  if (mode === "links" || mode === "union") {
    selectedLinks.forEach((link) => {
      addLabel({ labels, label: link.rowId, allowedLabels });
      addLabel({ labels, label: link.colId, allowedLabels });
    });
  }

  const orderedLabels =
    availableLabels.length > 0
      ? availableLabels.filter((label) => labels.has(label))
      : [...labels];

  if (orderedLabels.length === 0) return null;
  return {
    rows: orderedLabels,
    cols: orderedLabels,
  };
};
