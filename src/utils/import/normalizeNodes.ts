import { NodeMetadataSchema } from "@/utils/atlas/nodeMetadata";
import { parseNodeImportRecord } from "@/utils/import/schemas/nodeSchema";
import type {
  ImportedNetworkDraft,
  NetworkImportInference,
  NetworkImportIssue,
  NodeDraft,
} from "@/utils/import/types";

type NormalizeNodesArgs = {
  nodeMetadataPayload: unknown | null;
  networks: ImportedNetworkDraft[];
  errors: NetworkImportIssue[];
  inference: NetworkImportInference;
};

const getNetworkNodeCount = (
  networks: ImportedNetworkDraft[],
  errors: NetworkImportIssue[],
) => {
  const firstSize = networks[0]?.data.length ?? 0;
  networks.forEach((network) => {
    if (network.data.length !== firstSize) {
      errors.push({
        source: network.source,
        path: `${network.source}.data`,
        message: "All networks in a dataset must have the same node count.",
      });
    }
  });
  return firstSize;
};

const generatedNode = (index: number): NodeDraft => ({
  index,
  id: `node-${index + 1}`,
  label: `Node-${index + 1}`,
  name: `Node-${index + 1}`,
  metadata: {},
});

export const normalizeNodes = ({
  nodeMetadataPayload,
  networks,
  errors,
  inference,
}: NormalizeNodesArgs): NodeDraft[] => {
  const size = getNetworkNodeCount(networks, errors);
  if (size === 0) return [];

  if (nodeMetadataPayload === null) {
    const nodes = Array.from({ length: size }, (_, index) => generatedNode(index));
    inference.generatedNodes = true;
    inference.generatedNodeIds.push(...nodes.map((node) => node.id));
    errors.push({
      source: "rois.json",
      path: "rois.json",
      message: "rois.json is required.",
    });
    return nodes;
  }

  if (!Array.isArray(nodeMetadataPayload)) {
    errors.push({
      source: "rois.json",
      path: "rois.json",
      message: "rois.json must contain an array of Node objects.",
    });
    return [];
  }

  const seenIndexes = new Set<number>();
  const nodes = nodeMetadataPayload.flatMap((node, position) => {
    const source = `rois.json[${position}]`;
    const record = parseNodeImportRecord(node, source, errors);
    if (!record) {
      return [];
    }

    const metadataResult = NodeMetadataSchema.safeParse(record);
    if (!metadataResult.success) {
      errors.push({ source, path: `${source}.metadata`, message: metadataResult.error.message });
      return [];
    }
    const index = record.index;
    if (index >= size) {
      errors.push({
        source,
        path: `${source}.index`,
        message: `Node index must be lower than network size ${size}.`,
      });
    }
    if (seenIndexes.has(index)) {
      errors.push({
        source,
        path: `${source}.index`,
        message: `Duplicate Node index '${index}'.`,
      });
    }
    seenIndexes.add(index);

    const label = typeof record.label === "string" && record.label.trim()
      ? record.label.trim()
      : `Node-${index + 1}`;
    const name = typeof record.name === "string" && record.name.trim()
      ? record.name.trim()
      : label;
    const id = typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : `node-${index + 1}`;

    if (!record.id) inference.generatedNodeIds.push(id);
    if (!record.id) {
      errors.push({
        source,
        path: `${source}.id`,
        message: "Each Node must define id.",
      });
    }

    return [{
      index,
      id,
      label,
      name,
      ...(record.atlasId !== undefined ? { atlasId: record.atlasId } : {}),
      metadata: metadataResult.data,
      ...(record.coords !== undefined ? { coords: record.coords } : {}),
    }];
  });

  for (let index = 0; index < size; index += 1) {
    if (!seenIndexes.has(index)) {
      errors.push({
        source: "rois.json",
        path: "rois.json",
        message: `Node indexes must cover 0..${size - 1}; missing index ${index}.`,
      });
      break;
    }
  }

  return [...nodes].sort((left, right) => left.index - right.index);
};
