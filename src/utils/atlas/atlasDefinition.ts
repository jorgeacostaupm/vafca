import type {
  AtlasDefinition,
  AtlasMeshMode,
  AtlasRoi,
  AtlasTagValue,
  AtlasValidationResult,
} from "@/types/atlas";

const UNKNOWN_GROUP = "__unknown__";

const CORE_ROI_FIELDS = new Set([
  "index",
  "id",
  "atlasId",
  "name",
  "label",
  "tags",
  "coords",
  "metadata",
  "mesh_points",
]);

const PRESENTATION_ROI_FIELDS = new Set(["acronym"]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isValidPoint = (value: unknown): value is number[] => {
  if (!Array.isArray(value) || value.length !== 3) return false;
  return value.every(isFiniteNumber);
};

const hasValidMeshPoints = (roi: AtlasRoi) => {
  if (!Array.isArray(roi.mesh_points) || roi.mesh_points.length < 4) return false;
  return roi.mesh_points.every(isValidPoint);
};

const normalizeFieldValue = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : UNKNOWN_GROUP;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return UNKNOWN_GROUP;
};

const isScalar = (value: unknown) =>
  value === null ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean";

const isValidAtlasId = (value: unknown): value is string | number =>
  (typeof value === "string" && value.trim().length > 0) ||
  (typeof value === "number" && Number.isFinite(value));

const isTagValue = (value: unknown): value is AtlasTagValue => isScalar(value);

const normalizeTags = (value: unknown): Record<string, AtlasTagValue> => {
  if (!isObject(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, AtlasTagValue] =>
      isTagValue(entry[1]),
    ),
  );
};

const normalizeMetadata = (value: unknown): Record<string, unknown> =>
  isObject(value) ? { ...value } : {};

const normalizeCoords = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (!isObject(value)) return null;
  const { x, y, z, space } = value;
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) return null;
  return {
    x,
    y,
    z,
    ...(typeof space === "string" && space.trim() ? { space } : {}),
  };
};

const toAtlasPrefix = (atlasId: string) => atlasId.replace(/[^a-zA-Z0-9]+/g, "");

const buildInternalRoiId = (atlasId: string, roiAtlasId: string | number) => {
  const prefix = toAtlasPrefix(atlasId) || "atlas";
  if (typeof roiAtlasId === "number") {
    return `${prefix}_${String(roiAtlasId).padStart(3, "0")}`;
  }
  const numeric = Number(roiAtlasId);
  if (Number.isInteger(numeric)) {
    return `${prefix}_${String(numeric).padStart(3, "0")}`;
  }
  return `${prefix}_${roiAtlasId.trim()}`;
};

export const getRoiFieldValue = (roi: AtlasRoi | undefined | null, field: string) =>
  roi?.tags?.[field] ?? (roi as unknown as Record<string, unknown> | null)?.[field];

const getTagFieldNames = (atlas: AtlasDefinition | null) => {
  if (!atlas?.rois?.length) return [];
  const fields = new Set<string>();
  atlas.rois.forEach((roi) => {
    Object.keys(roi.tags ?? {}).forEach((field) => {
      fields.add(field);
    });
  });
  return Array.from(fields);
};

export const getCommonRoiFields = (atlas: AtlasDefinition | null) => {
  if (!atlas?.rois?.length) return [];
  return getTagFieldNames(atlas).filter((key) =>
    atlas.rois.some((roi) => isScalar(getRoiFieldValue(roi, key))),
  );
};

export const getDefaultGroupByFields = (fields: string[]) => {
  if (fields.length === 0) return [];

  const priority = [
    "hemisphere",
    "lobule",
    "lobe",
    "region",
    "network",
    "subnetwork",
  ];

  const preferred = priority.filter((field) => fields.includes(field));
  if (preferred.length > 0) return preferred.slice(0, 2);

  const lessUseful = new Set(["id", "label", "name", "acronym"]);
  const useful = fields.filter((field) => !lessUseful.has(field));
  if (useful.length > 0) return useful.slice(0, 2);

  return fields.slice(0, 1);
};

export const atlasSupports3d = (
  atlas: AtlasDefinition | null,
  meshMode?: AtlasMeshMode | null,
) => {
  if (!atlas?.rois?.length) return false;
  if (meshMode === "without_mesh_points") return false;

  return atlas.rois.some(hasValidMeshPoints);
};

export const validateAtlasDefinition = (
  value: unknown,
): AtlasValidationResult => {
  if (!isObject(value)) {
    return { ok: false, error: "The file does not contain a valid JSON object." };
  }

  const id = value.id;
  if (typeof id !== "string" || id.trim().length === 0) {
    return { ok: false, error: "The atlas must include an 'id' string field." };
  }

  const name = value.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    return { ok: false, error: "The atlas must include a 'name' string field." };
  }

  const roisRaw = value.rois;
  if (!Array.isArray(roisRaw) || roisRaw.length === 0) {
    return {
      ok: false,
      error: "The atlas must include a non-empty 'rois' array.",
    };
  }

  const seenIds = new Set<string>();
  const seenIndexes = new Set<number>();
  const rois: AtlasRoi[] = [];
  const atlasId = id.trim();

  for (let index = 0; index < roisRaw.length; index += 1) {
    const roiRaw = roisRaw[index];
    if (!isObject(roiRaw)) {
      return {
        ok: false,
        error: `ROI ${index + 1} is not a valid JSON object.`,
      };
    }

    const atlasRoiId = roiRaw.atlasId ?? roiRaw.id;
    if (!isValidAtlasId(atlasRoiId)) {
      return {
        ok: false,
        error: `ROI ${index + 1} must include a valid string or numeric 'atlasId'.`,
      };
    }

    const roiIndex = roiRaw.index;
    const normalizedIndex =
      typeof roiIndex === "number" && Number.isInteger(roiIndex) ? roiIndex : index;
    if (normalizedIndex < 0 || normalizedIndex >= roisRaw.length) {
      return { ok: false, error: `ROI ${index + 1} has an out-of-range 'index'.` };
    }
    if (seenIndexes.has(normalizedIndex)) {
      return { ok: false, error: `Duplicate ROI index detected: ${normalizedIndex}.` };
    }
    seenIndexes.add(normalizedIndex);

    const name = roiRaw.name;
    const label = roiRaw.label;
    if (typeof name !== "string" || name.trim().length === 0) {
      return { ok: false, error: `ROI ${index + 1} must include a valid 'name'.` };
    }
    if (typeof label !== "string" || label.trim().length === 0) {
      return { ok: false, error: `ROI ${index + 1} must include a valid 'label'.` };
    }

    const roiId = roiRaw.atlasId === undefined
      ? buildInternalRoiId(atlasId, atlasRoiId)
      : roiRaw.id;
    if (typeof roiId !== "string" || roiId.trim().length === 0) {
      return { ok: false, error: `ROI ${index + 1} must include a valid string 'id'.` };
    }
    const roiIdKey = String(roiId);
    if (seenIds.has(roiIdKey)) {
      return { ok: false, error: `Duplicate ROI ID detected: ${roiIdKey}.` };
    }
    seenIds.add(roiIdKey);

    const tags = normalizeTags(roiRaw.tags);
    Object.entries(roiRaw).forEach(([key, entryValue]) => {
      if (CORE_ROI_FIELDS.has(key) || PRESENTATION_ROI_FIELDS.has(key)) return;
      if (isTagValue(entryValue)) tags[key] = entryValue;
    });
    const metadata = normalizeMetadata(roiRaw.metadata);
    PRESENTATION_ROI_FIELDS.forEach((key) => {
      if (key in roiRaw) metadata[key] = roiRaw[key];
    });

    const roi: AtlasRoi = {
      index: normalizedIndex,
      id: roiId.trim(),
      atlasId: atlasRoiId,
      name,
      label,
      tags,
      coords: normalizeCoords(roiRaw.coords),
      metadata,
      ...(Array.isArray(roiRaw.mesh_points) ? { mesh_points: roiRaw.mesh_points as number[][] } : {}),
    };

    rois.push(roi);
  }

  if (seenIndexes.size !== roisRaw.length) {
    return { ok: false, error: "Atlas ROI indexes must cover 0..N-1." };
  }

  const atlas: AtlasDefinition = {
    id: atlasId,
    name,
    description: typeof value.description === "string" ? value.description : undefined,
    version: typeof value.version === "string" ? value.version : undefined,
    space: typeof value.space === "string" ? value.space : undefined,
    coordinateSystem:
      typeof value.coordinateSystem === "string" ? value.coordinateSystem : undefined,
    rois: rois.sort((a, b) => a.index - b.index),
  };

  return {
    ok: true,
    atlas,
    commonFields: getCommonRoiFields(atlas),
  };
};

export const humanizeFieldName = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

export const normalizeRoiFieldValue = (value: unknown) => normalizeFieldValue(value);

export const countRoisWithoutValidMeshPoints = (atlas: AtlasDefinition | null) => {
  if (!atlas?.rois?.length) return 0;
  return atlas.rois.reduce((count, roi) => (hasValidMeshPoints(roi) ? count : count + 1), 0);
};

export { UNKNOWN_GROUP };
