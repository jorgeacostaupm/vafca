import { isRecord, isScalarTagValue } from "@/utils/import/guards";
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
  warnings: NetworkImportIssue[];
  inference: NetworkImportInference;
  strict: boolean;
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

const normalizeTags = (
  value: unknown,
  source: string,
  errors: NetworkImportIssue[],
) => {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    errors.push({
      source,
      path: `${source}.tags`,
      message: "Node tags must be an object.",
    });
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, tagValue]) => isScalarTagValue(tagValue)),
  ) as NodeDraft["tags"];
};

const generatedNode = (index: number): NodeDraft => ({
  index,
  id: `node-${index + 1}`,
  label: `Node-${index + 1}`,
  name: `Node-${index + 1}`,
  tags: {},
  metadata: {},
});

export const normalizeNodes = ({
  nodeMetadataPayload,
  networks,
  errors,
  warnings,
  inference,
  strict,
}: NormalizeNodesArgs): NodeDraft[] => {
  const size = getNetworkNodeCount(networks, errors);
  if (size === 0) return [];

  if (nodeMetadataPayload === null) {
    const nodes = Array.from({ length: size }, (_, index) => generatedNode(index));
    inference.generatedNodes = true;
    inference.generatedNodeIds.push(...nodes.map((node) => node.id));
    const issue = {
      source: "rois.json",
      path: "rois.json",
      message: "rois.json is missing; generated generic Node labels from network size.",
    };
    if (strict) errors.push(issue);
    else warnings.push(issue);
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
    if (strict && !record.id) {
      errors.push({
        source,
        path: `${source}.id`,
        message: "Strict import requires each Node to define id.",
      });
    }

    return [{
      index,
      id,
      label,
      name,
      tags: normalizeTags(record.tags, source, errors),
      metadata: record.metadata ?? {},
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
