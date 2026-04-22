import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MatrixOrderEntry } from "@/utils/matrixOrder";
import {
  DEFAULT_D3_CATEGORICAL_PALETTE,
  type D3CategoricalPaletteKey,
} from "@/utils/atlas/coloring";

export type AtlasLabel = {
  id: string;
  label: string;
  acronym?: string;
  enabled: boolean;
};

export type AtlasState = {
  order: string[];
  labelsById: Record<string, AtlasLabel>;
  initialized: boolean;
  colorFields: string[];
  colorPalette: D3CategoricalPaletteKey;
  circularHierarchyFields: string[];
  circularHierarchyCategoryOrder: Record<string, string[]>;
  matrixHierarchyFields: string[];
  matrixHierarchyCategoryOrder: Record<string, string[]>;
};

const initialState: AtlasState = {
  order: [],
  labelsById: {},
  initialized: false,
  colorFields: [],
  colorPalette: DEFAULT_D3_CATEGORICAL_PALETTE,
  circularHierarchyFields: [],
  circularHierarchyCategoryOrder: {},
  matrixHierarchyFields: [],
  matrixHierarchyCategoryOrder: {},
};

const atlasSlice = createSlice({
  name: "atlas",
  initialState,
  reducers: {
    setAtlasLabels(
      state,
      action: PayloadAction<{
        order: string[];
        labelsById: Record<string, AtlasLabel>;
      }>,
    ) {
      state.order = action.payload.order;
      state.labelsById = action.payload.labelsById;
      state.initialized = true;
    },
    setLabelEnabled(
      state,
      action: PayloadAction<{ id: string; enabled: boolean }>,
    ) {
      const label = state.labelsById[action.payload.id];
      if (!label) return;
      label.enabled = action.payload.enabled;
    },
    setLabelsEnabled(
      state,
      action: PayloadAction<{ ids: string[]; enabled: boolean }>,
    ) {
      const { ids, enabled } = action.payload;
      for (const id of ids) {
        const label = state.labelsById[id];
        if (label) label.enabled = enabled;
      }
    },
    setAllLabels(state, action: PayloadAction<boolean>) {
      const enabled = action.payload;
      for (const id of state.order) {
        const label = state.labelsById[id];
        if (label) label.enabled = enabled;
      }
    },
    setAtlasColorFields(state, action: PayloadAction<string[]>) {
      state.colorFields = action.payload;
    },
    setAtlasColorPalette(
      state,
      action: PayloadAction<D3CategoricalPaletteKey>,
    ) {
      state.colorPalette = action.payload;
    },
    setCircularHierarchyFields(state, action: PayloadAction<string[]>) {
      state.circularHierarchyFields = action.payload;
    },
    setCircularHierarchyCategoryOrder(
      state,
      action: PayloadAction<Record<string, string[]>>,
    ) {
      state.circularHierarchyCategoryOrder = action.payload;
    },
    setMatrixHierarchyFields(state, action: PayloadAction<string[]>) {
      state.matrixHierarchyFields = action.payload;
    },
    setMatrixHierarchyCategoryOrder(
      state,
      action: PayloadAction<Record<string, string[]>>,
    ) {
      state.matrixHierarchyCategoryOrder = action.payload;
    },
  },
});

export const {
  setAtlasLabels,
  setLabelEnabled,
  setLabelsEnabled,
  setAllLabels,
  setAtlasColorFields,
  setAtlasColorPalette,
  setCircularHierarchyFields,
  setCircularHierarchyCategoryOrder,
  setMatrixHierarchyFields,
  setMatrixHierarchyCategoryOrder,
} = atlasSlice.actions;

export const buildAtlasState = (
  items: MatrixOrderEntry[],
  previous?: AtlasState,
): AtlasState => {
  const order = items.map((item) => item.id);
  const baseEnabledMap = previous?.initialized
    ? Object.fromEntries(
        Object.entries(previous.labelsById).map(([id, value]) => [
          id,
          value.enabled,
        ]),
      )
    : null;

  const labelsById = items.reduce<Record<string, AtlasLabel>>(
    (acc, item) => {
      const enabled =
        baseEnabledMap && item.id in baseEnabledMap
          ? Boolean(baseEnabledMap[item.id])
          : baseEnabledMap
            ? false
            : true;
      acc[item.id] = {
        id: item.id,
        label: item.label,
        acronym: item.acronym,
        enabled,
      };
      return acc;
    },
    {},
  );

  return {
    order,
    labelsById,
    initialized: true,
    colorFields: previous?.colorFields ?? [],
    colorPalette: previous?.colorPalette ?? DEFAULT_D3_CATEGORICAL_PALETTE,
    circularHierarchyFields: previous?.circularHierarchyFields ?? [],
    circularHierarchyCategoryOrder: previous?.circularHierarchyCategoryOrder ?? {},
    matrixHierarchyFields: previous?.matrixHierarchyFields ?? [],
    matrixHierarchyCategoryOrder: previous?.matrixHierarchyCategoryOrder ?? {},
  };
};

export const areAtlasStatesEqual = (a: AtlasState, b: AtlasState) => {
  if (a.order.length !== b.order.length) return false;
  for (let i = 0; i < a.order.length; i += 1) {
    if (a.order[i] !== b.order[i]) return false;
  }
  for (const id of a.order) {
    const aLabel = a.labelsById[id];
    const bLabel = b.labelsById[id];
    if (!aLabel || !bLabel) return false;
    if (aLabel.enabled !== bLabel.enabled) return false;
    if (aLabel.acronym !== bLabel.acronym) return false;
    if (aLabel.label !== bLabel.label) return false;
  }
  if (a.colorPalette !== b.colorPalette) return false;
  if (a.colorFields.length !== b.colorFields.length) return false;
  for (let i = 0; i < a.colorFields.length; i += 1) {
    if (a.colorFields[i] !== b.colorFields[i]) return false;
  }
  if (a.circularHierarchyFields.length !== b.circularHierarchyFields.length) {
    return false;
  }
  for (let i = 0; i < a.circularHierarchyFields.length; i += 1) {
    if (a.circularHierarchyFields[i] !== b.circularHierarchyFields[i]) {
      return false;
    }
  }
  const aOrderKeys = Object.keys(a.circularHierarchyCategoryOrder).sort();
  const bOrderKeys = Object.keys(b.circularHierarchyCategoryOrder).sort();
  if (aOrderKeys.length !== bOrderKeys.length) return false;
  for (let i = 0; i < aOrderKeys.length; i += 1) {
    if (aOrderKeys[i] !== bOrderKeys[i]) return false;
    const aValues = a.circularHierarchyCategoryOrder[aOrderKeys[i]] ?? [];
    const bValues = b.circularHierarchyCategoryOrder[bOrderKeys[i]] ?? [];
    if (aValues.length !== bValues.length) return false;
    for (let j = 0; j < aValues.length; j += 1) {
      if (aValues[j] !== bValues[j]) return false;
    }
  }
  if (a.matrixHierarchyFields.length !== b.matrixHierarchyFields.length) {
    return false;
  }
  for (let i = 0; i < a.matrixHierarchyFields.length; i += 1) {
    if (a.matrixHierarchyFields[i] !== b.matrixHierarchyFields[i]) {
      return false;
    }
  }
  const aMatrixOrderKeys = Object.keys(a.matrixHierarchyCategoryOrder).sort();
  const bMatrixOrderKeys = Object.keys(b.matrixHierarchyCategoryOrder).sort();
  if (aMatrixOrderKeys.length !== bMatrixOrderKeys.length) return false;
  for (let i = 0; i < aMatrixOrderKeys.length; i += 1) {
    if (aMatrixOrderKeys[i] !== bMatrixOrderKeys[i]) return false;
    const aValues = a.matrixHierarchyCategoryOrder[aMatrixOrderKeys[i]] ?? [];
    const bValues = b.matrixHierarchyCategoryOrder[bMatrixOrderKeys[i]] ?? [];
    if (aValues.length !== bValues.length) return false;
    for (let j = 0; j < aValues.length; j += 1) {
      if (aValues[j] !== bValues[j]) return false;
    }
  }
  return true;
};

export default atlasSlice.reducer;
