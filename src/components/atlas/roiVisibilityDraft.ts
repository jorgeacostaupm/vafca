import type { AtlasLabel } from "@/types/atlas";
import { isAtlasLabelEnabled } from "@/utils/atlas/labels";

export const buildEffectiveRoiEnabledMap = ({
  order,
  labelsById,
  draft,
}: {
  order: string[];
  labelsById: Record<string, AtlasLabel>;
  draft: Record<string, boolean> | null;
}) =>
  Object.fromEntries(
    order.map((id) => [
      id,
      draft?.[id] ?? isAtlasLabelEnabled(labelsById[id]),
    ]),
  ) as Record<string, boolean>;

export const countEnabledRois = (enabledById: Record<string, boolean>) =>
  Object.values(enabledById).filter(Boolean).length;

export const countChangedRois = ({
  order,
  labelsById,
  draft,
}: {
  order: string[];
  labelsById: Record<string, AtlasLabel>;
  draft: Record<string, boolean> | null;
}) => {
  if (!draft) return 0;
  return order.filter(
    (id) => draft[id] !== isAtlasLabelEnabled(labelsById[id]),
  ).length;
};
