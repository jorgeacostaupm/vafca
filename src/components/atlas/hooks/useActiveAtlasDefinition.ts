import { useMemo } from "react";
import { shallowEqual } from "react-redux";

import { useAtlasDefinition } from "@/hooks/useAtlasDefinition";
import { useAppSelector } from "@/store/hooks";
import {
  selectAtlasLabelsById,
  selectAtlasOrder,
} from "@/store/slices/atlasUi";
import { selectDatasetData } from "@/store/slices/dataset";
import type { AtlasDefinition } from "@/types/atlas";
import {
  getDatasetAtlasId,
  getDatasetAtlasLabel,
} from "@/utils/datasetAccessors";

export const useActiveAtlasDefinition = () => {
  const atlasOrder = useAppSelector(selectAtlasOrder);
  const labelsById = useAppSelector(selectAtlasLabelsById, shallowEqual);
  const dataset = useAppSelector((state) => selectDatasetData(state));
  const datasetAtlasId = getDatasetAtlasId(dataset);
  const datasetAtlasLabel = getDatasetAtlasLabel(dataset);
  const atlasDefinition = useAtlasDefinition(datasetAtlasId);

  return useMemo<AtlasDefinition | null>(() => {
    if (atlasDefinition || atlasOrder.length === 0) return atlasDefinition;

    return {
      id: datasetAtlasId ?? "active-atlas",
      name: datasetAtlasLabel,
      nodes: atlasOrder.map((id, index) => {
        const label = labelsById[id];
        return {
          index,
          id,
          atlasId: id,
          name: label?.name ?? label?.label ?? id,
          label: label?.acronym ?? label?.label ?? id,

          metadata: label?.metadata ?? {},
          coords: null,
        };
      }),
    };
  }, [atlasDefinition, atlasOrder, datasetAtlasId, datasetAtlasLabel, labelsById]);
};
