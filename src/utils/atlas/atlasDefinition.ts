import type {
  AtlasDefinition,
  AtlasMeshMode,
  AtlasRoi,
  AtlasValidationResult,
} from "@/types/atlas";

const UNKNOWN_GROUP = "__unknown__";


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
  typeof value === "string" || typeof value === "number" || typeof value === "boolean";

export const getCommonRoiFields = (atlas: AtlasDefinition | null) => {
  if (!atlas?.rois?.length) return [];
  const first = atlas.rois[0];
  if (!first || typeof first !== "object") return [];

  const keys = Object.keys(first).filter((key) => key !== "mesh_points");
  return keys.filter((key) =>
    atlas.rois.every((roi) => key in roi && isScalar((roi as Record<string, unknown>)[key])),
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
    return { ok: false, error: "El archivo no contiene un objeto JSON válido." };
  }

  const id = value.id;
  if (typeof id !== "string" || id.trim().length === 0) {
    return { ok: false, error: "El atlas debe incluir un campo 'id' de tipo string." };
  }

  const roisRaw = value.rois;
  if (!Array.isArray(roisRaw) || roisRaw.length === 0) {
    return {
      ok: false,
      error: "El atlas debe incluir una lista 'rois' con al menos un elemento.",
    };
  }

  const seen = new Set<string>();
  const rois: AtlasRoi[] = [];

  for (let index = 0; index < roisRaw.length; index += 1) {
    const roiRaw = roisRaw[index];
    if (!isObject(roiRaw)) {
      return {
        ok: false,
        error: `ROI ${index + 1} no es un objeto JSON válido.`,
      };
    }

    const roiId = roiRaw.id;
    if (
      (typeof roiId !== "string" || roiId.trim().length === 0) &&
      (typeof roiId !== "number" || !Number.isFinite(roiId))
    ) {
      return {
        ok: false,
        error: `ROI ${index + 1} debe incluir un 'id' string o numérico válido.`,
      };
    }

    const roiIdKey = String(roiId);
    if (seen.has(roiIdKey)) {
      return { ok: false, error: `ID de ROI duplicado detectado: ${roiIdKey}.` };
    }
    seen.add(roiIdKey);

    const roi: AtlasRoi = { ...roiRaw } as AtlasRoi;

    rois.push(roi);
  }

  const atlas: AtlasDefinition = {
    id: id.trim(),
    name:
      typeof value.name === "string"
        ? value.name
        : typeof value.title === "string"
          ? value.title
          : undefined,
    description: typeof value.description === "string" ? value.description : undefined,
    rois,
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
