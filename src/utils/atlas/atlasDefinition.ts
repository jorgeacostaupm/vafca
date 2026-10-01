import type {
  AtlasDefinition,
  AtlasNode,
  AtlasValidationResult,
} from "@/types/atlas";
import { NodeMetadataSchema } from "@/utils/atlas/nodeMetadata";

const UNKNOWN_GROUP = "__unknown__";

const CORE_NODE_FIELDS = new Set([
  "index",
  "id",
  "atlasId",
  "name",
  "label",
  "tags",
  "coords",
  "metadata",
]);

const PRESENTATION_NODE_FIELDS = new Set(["acronym"]);

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

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

const buildInternalNodeId = (atlasId: string, nodeAtlasId: string | number) => {
  const prefix = toAtlasPrefix(atlasId) || "atlas";
  if (typeof nodeAtlasId === "number") {
    return `${prefix}_${String(nodeAtlasId).padStart(3, "0")}`;
  }
  const numeric = Number(nodeAtlasId);
  if (Number.isInteger(numeric)) {
    return `${prefix}_${String(numeric).padStart(3, "0")}`;
  }
  return `${prefix}_${nodeAtlasId.trim()}`;
};

export const getNodeFieldValue = (node: AtlasNode | undefined | null, field: string) =>
  node?.metadata?.[field] ?? (node as unknown as Record<string, unknown> | null)?.[field];

const getMetadataFieldNames = (atlas: AtlasDefinition | null) => {
  if (!atlas?.nodes?.length) return [];
  const fields = new Set<string>();
  atlas.nodes.forEach((node) => {
    Object.keys(node.metadata ?? {}).forEach((field) => {
      fields.add(field);
    });
  });
  return Array.from(fields);
};

export const getCommonNodeFields = (atlas: AtlasDefinition | null) => {
  if (!atlas?.nodes?.length) return [];
  return getMetadataFieldNames(atlas).filter((key) =>
    atlas.nodes.some((node) => isScalar(getNodeFieldValue(node, key))),
  );
};

export const atlasSupports3d = (atlas: AtlasDefinition | null) => {
  if (!atlas?.nodes?.length) return false;

  return Boolean(atlas.spatial?.matchedRois) || atlas.nodes.some(node => atlas.spatial?.anchors[node.id] || (node.coords != null && [node.coords.x, node.coords.y, node.coords.z].every(isFiniteNumber)));
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

  const nodesRaw = value.nodes ?? value.rois;
  if (!Array.isArray(nodesRaw) || nodesRaw.length === 0) {
    return {
      ok: false,
      error: "The atlas must include a non-empty 'nodes' or 'rois' array.",
    };
  }

  const seenIds = new Set<string>();
  const seenIndexes = new Set<number>();
  const nodes: AtlasNode[] = [];
  const atlasId = id.trim();

  for (let index = 0; index < nodesRaw.length; index += 1) {
    const nodeRaw = nodesRaw[index];
    if (!isObject(nodeRaw)) {
      return {
        ok: false,
        error: `Node ${index + 1} is not a valid JSON object.`,
      };
    }

    const atlasNodeId = nodeRaw.atlasId ?? nodeRaw.id;
    if (!isValidAtlasId(atlasNodeId)) {
      return {
        ok: false,
        error: `Node ${index + 1} must include a valid string or numeric 'atlasId'.`,
      };
    }

    const nodeIndex = nodeRaw.index;
    const normalizedIndex =
      typeof nodeIndex === "number" && Number.isInteger(nodeIndex) ? nodeIndex : index;
    if (normalizedIndex < 0 || normalizedIndex >= nodesRaw.length) {
      return { ok: false, error: `Node ${index + 1} has an out-of-range 'index'.` };
    }
    if (seenIndexes.has(normalizedIndex)) {
      return { ok: false, error: `Duplicate Node index detected: ${normalizedIndex}.` };
    }
    seenIndexes.add(normalizedIndex);

    const name = nodeRaw.name;
    const label = nodeRaw.label;
    if (typeof name !== "string" || name.trim().length === 0) {
      return { ok: false, error: `Node ${index + 1} must include a valid 'name'.` };
    }
    if (typeof label !== "string" || label.trim().length === 0) {
      return { ok: false, error: `Node ${index + 1} must include a valid 'label'.` };
    }

    const nodeId = nodeRaw.atlasId === undefined
      ? buildInternalNodeId(atlasId, atlasNodeId)
      : nodeRaw.id;
    if (typeof nodeId !== "string" || nodeId.trim().length === 0) {
      return { ok: false, error: `Node ${index + 1} must include a valid string 'id'.` };
    }
    const nodeIdKey = String(nodeId);
    if (seenIds.has(nodeIdKey)) {
      return { ok: false, error: `Duplicate Node ID detected: ${nodeIdKey}.` };
    }
    seenIds.add(nodeIdKey);

    const metadataResult = NodeMetadataSchema.safeParse(nodeRaw);
    if (!metadataResult.success) return { ok: false, error: metadataResult.error.message };
    const metadata = metadataResult.data;
    Object.entries(nodeRaw).forEach(([key, entryValue]) => {
      if (CORE_NODE_FIELDS.has(key) || PRESENTATION_NODE_FIELDS.has(key)) return;
      if (isScalar(entryValue) && !Object.hasOwn(metadata, key)) metadata[key] = entryValue;
    });
    PRESENTATION_NODE_FIELDS.forEach((key) => {
      if (key in nodeRaw) metadata[key] = nodeRaw[key];
    });

    const node: AtlasNode = {
      index: normalizedIndex,
      id: nodeId.trim(),
      atlasId: atlasNodeId,
      name,
      label,
      coords: normalizeCoords(nodeRaw.coords),
      metadata,
    };

    nodes.push(node);
  }

  if (seenIndexes.size !== nodesRaw.length) {
    return { ok: false, error: "Atlas Node indexes must cover 0..N-1." };
  }

  const atlas: AtlasDefinition = {
    id: atlasId,
    name,
    description: typeof value.description === "string" ? value.description : undefined,
    version: typeof value.version === "string" ? value.version : undefined,
    space: typeof value.space === "string" ? value.space : undefined,
    coordinateSystem:
      typeof value.coordinateSystem === "string" ? value.coordinateSystem : undefined,
    nodes: nodes.sort((a, b) => a.index - b.index),
  };

  return {
    ok: true,
    atlas,
    commonFields: getCommonNodeFields(atlas),
  };
};

export const humanizeFieldName = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

export const normalizeNodeFieldValue = (value: unknown) => normalizeFieldValue(value);

export { UNKNOWN_GROUP };
