import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { StatRangeValue } from "@/types/matrixView";
import { areZoomSelectionsEqual } from "@/utils/matrixViewUtils";

export type ZoomSelection = { rows: string[]; cols: string[] } | null;

export type ZoomableViewSettings = {
  statRange?: StatRangeValue;
  zoomLabelSelection?: string[];
  zoomHistory?: ZoomSelection[];
  zoomIndex?: number;
};

export const getZoomState = (settings?: ZoomableViewSettings) => {
  const history = settings?.zoomHistory ?? [null];
  const index = Math.min(settings?.zoomIndex ?? 0, history.length - 1);
  return {
    history,
    index,
    current: history[index] ?? null,
  };
};

export const useViewSettingsState = <T extends ZoomableViewSettings>({
  syncZoom,
  getTargetIds,
  setSettings,
  defaultStatRanges,
}: {
  syncZoom: boolean;
  getTargetIds: (triggerId: string) => string[];
  setSettings: Dispatch<SetStateAction<Record<string, T>>>;
  defaultStatRanges: Record<string, StatRangeValue | undefined>;
}) => {
  const patchSettings = useCallback(
    (viewId: string, patch: Partial<T>) => {
      setSettings((prev) => ({
        ...prev,
        [viewId]: {
          ...prev[viewId],
          ...patch,
        },
      }));
    },
    [setSettings],
  );

  const updateStatRange = useCallback(
    (
      viewId: string,
      value: [number, number],
      segment?: "negative" | "positive",
      statIdForRange?: string,
    ) => {
      setSettings((prev) => {
        const current = prev[viewId]?.statRange;
        if (!segment) {
          return {
            ...prev,
            [viewId]: {
              ...prev[viewId],
              statRange: value,
            },
          };
        }

        const fallback =
          statIdForRange &&
          defaultStatRanges[statIdForRange] &&
          !Array.isArray(defaultStatRanges[statIdForRange])
            ? (defaultStatRanges[statIdForRange] as StatRangeValue)
            : undefined;

        const base =
          current && !Array.isArray(current)
            ? current
            : fallback && !Array.isArray(fallback)
              ? fallback
              : { negative: value, positive: value };

        return {
          ...prev,
          [viewId]: {
            ...prev[viewId],
            statRange: {
              ...base,
              [segment]: value,
            },
          },
        };
      });
    },
    [defaultStatRanges, setSettings],
  );

  const resetSettings = useCallback(
    (viewId: string) => {
      setSettings((prev) => {
        const next = { ...prev };
        delete next[viewId];
        return next;
      });
    },
    [setSettings],
  );

  const applyZoom = useCallback(
    (viewId: string, selection: ZoomSelection) => {
      setSettings((prev) => {
        const targetIds = syncZoom ? getTargetIds(viewId) : [viewId];
        let changed = false;
        const next = { ...prev };

        for (const targetId of targetIds) {
          const currentSettings = prev[targetId] ?? ({} as T);
          const { history, index, current } = getZoomState(currentSettings);
          if (areZoomSelectionsEqual(current, selection)) continue;
          const nextHistory = history.slice(0, index + 1);
          nextHistory.push(selection);
          next[targetId] = {
            ...currentSettings,
            zoomHistory: nextHistory,
            zoomIndex: nextHistory.length - 1,
          };
          changed = true;
        }

        return changed ? next : prev;
      });
    },
    [getTargetIds, setSettings, syncZoom],
  );

  const toggleZoomLabelSelection = useCallback(
    (viewId: string, label: string, orderedLabels?: string[]) => {
      setSettings((prev) => {
        const currentSettings = prev[viewId] ?? ({} as T);
        const current = currentSettings.zoomLabelSelection ?? [];
        const exists = current.includes(label);
        const nextRaw = exists
          ? current.filter((item) => item !== label)
          : [...current, label];
        const next =
          orderedLabels && nextRaw.length > 1
            ? orderedLabels.filter((item) => nextRaw.includes(item))
            : nextRaw;

        return {
          ...prev,
          [viewId]: {
            ...currentSettings,
            zoomLabelSelection: next,
          },
        };
      });
    },
    [setSettings],
  );

  const resetZoomLabelSelection = useCallback(
    (viewId: string) => {
      setSettings((prev) => {
        const currentSettings = prev[viewId] ?? ({} as T);
        if (!currentSettings.zoomLabelSelection?.length) return prev;
        return {
          ...prev,
          [viewId]: {
            ...currentSettings,
            zoomLabelSelection: [],
          },
        };
      });
    },
    [setSettings],
  );

  const stepZoomHistory = useCallback(
    (viewId: string, delta: -1 | 1) => {
      setSettings((prev) => {
        const targetIds = syncZoom ? getTargetIds(viewId) : [viewId];
        let changed = false;
        const next = { ...prev };

        for (const targetId of targetIds) {
          const currentSettings = prev[targetId];
          if (!currentSettings) continue;
          const { history, index } = getZoomState(currentSettings);
          const nextIndex = Math.min(Math.max(index + delta, 0), history.length - 1);
          if (nextIndex === index) continue;
          next[targetId] = {
            ...currentSettings,
            zoomIndex: nextIndex,
          };
          changed = true;
        }

        return changed ? next : prev;
      });
    },
    [getTargetIds, setSettings, syncZoom],
  );

  return {
    patchSettings,
    updateStatRange,
    resetSettings,
    applyZoom,
    toggleZoomLabelSelection,
    resetZoomLabelSelection,
    stepZoomHistory,
  };
};
