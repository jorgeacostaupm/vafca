import {
  DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS,
  DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS,
} from "@/config/ui";
import type { Network, NetworkDataset } from "@/types/network";
import type {
  LinkRankingRow,
  NetworkRankingRow,
  NodeRankingRow,
  RankingQuery,
  RankingResult,
} from "@/types/rankings";
import { getNetworkValue, isDirectedNetwork } from "@/utils/networkData";
import {
  getNetworkAggregationGroupingKey,
  getNetworkLabel,
  getNetworkSource,
  getRankingNetworkKind,
  resolveNetworkEndpointIds,
  resolveRankingNetworkCollection,
} from "@/utils/rankings/rankingNetworkMetadata";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const mean = (values: number[]) =>
  values.length > 0
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : Number.NaN;

const sortRows = <T extends { score: number }>(rows: T[], metric?: string) => {
  const ascending = metric === "lowestValue" || metric === "minValue";
  return [...rows].sort((a, b) =>
    ascending ? a.score - b.score : b.score - a.score,
  );
};

const scoreValues = (values: number[], metric?: string, threshold = 0) => {
  if (values.length === 0) return Number.NaN;
  switch (metric) {
    case "meanValue":
    case "meanAcrossMatrices":
      return mean(values);
    case "medianValue": {
      const sorted = [...values].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    }
    case "meanAbsValue":
    case "meanAbsAcrossMatrices":
      return mean(values.map(Math.abs));
    case "maxValue":
    case "highestValue":
      return Math.max(...values);
    case "maxAbsValue":
    case "highestAbsValue":
      return Math.max(...values.map(Math.abs));
    case "minValue":
    case "lowestValue":
      return Math.min(...values);
    case "countAboveThreshold":
      return values.filter((value) => value > threshold).length;
    case "percentAboveThreshold":
      return (values.filter((value) => value > threshold).length / values.length) * 100;
    case "countAbsAboveThreshold":
      return values.filter((value) => Math.abs(value) > threshold).length;
    default:
      return Number.NaN;
  }
};

function* iterateNetworkValues(network: Network) {
  const directed = isDirectedNetwork(network);
  for (let i = 0; i < network.nodeIds.length; i += 1) {
    const start = directed ? 0 : i;
    for (let j = start; j < network.nodeIds.length; j += 1) {
      const sourceId = network.nodeIds[i];
      const targetId = network.nodeIds[j];
      if (!sourceId || !targetId) continue;
      yield {
        i,
        j,
        value: getNetworkValue(network, sourceId, targetId),
      };
    }
  }
}

const getEndpointLabel = (
  dataset: NetworkDataset,
  id: string,
  network?: Network,
) =>
  (network?.derivation?.type === "aggregation"
    ? network.derivation.groups.find((group) => group.id === id)?.label
    : undefined) ??
  dataset.nodeSet.nodes.find((node) => node.id === id)?.label ??
  dataset.nodeSet.nodes.find((node) => String(node.metadata.atlasId) === id)?.label ??
  id;

const getEndpointGroup = (dataset: NetworkDataset, id: string) => {
  const node = dataset.nodeSet.nodes.find((item) => item.id === id);
  const group = node?.tags.network ?? node?.tags.group ?? node?.tags.region;
  return typeof group === "string" ? group : undefined;
};

const getActiveNodeIds = (activeLabels: Set<string> | null) => activeLabels;

const isEligibleEdge = (
  network: Network,
  i: number,
  j: number,
  activeNodes: Set<string> | null,
  activeFilterMask: boolean[][] | null,
) => {
  const ids = resolveNetworkEndpointIds(network);
  const sourceId = ids[i];
  const targetId = ids[j];
  if (!sourceId || !targetId) return false;
  if (network.derivation?.type !== "aggregation") {
    const active = getActiveNodeIds(activeNodes);
    if (active && (!active.has(sourceId) || !active.has(targetId))) return false;
  }
  if (activeFilterMask && network.derivation?.type !== "aggregation") {
    return Boolean(activeFilterMask[i]?.[j] ?? activeFilterMask[j]?.[i]);
  }
  return true;
};

type CalculationContext = {
  datasetContent: NetworkDataset;
  query: RankingQuery;
  activeNodes: Set<string> | null;
  activeFilterMask: boolean[][] | null;
};

export const computeNetworkRanking = ({
  datasetContent: dataset,
  query,
  activeNodes,
  activeFilterMask,
}: CalculationContext): Omit<RankingResult, "id" | "createdAt"> => {
  const networks = resolveRankingNetworkCollection(dataset, query);
  const rows = networks
    .map<NetworkRankingRow | null>((network) => {
      const values: number[] = [];
      for (const edge of iterateNetworkValues(network)) {
        if (
          !isEligibleEdge(
            network,
            edge.i,
            edge.j,
            activeNodes,
            activeFilterMask,
          )
        ) {
          continue;
        }
        if (isFiniteNumber(edge.value)) values.push(edge.value);
      }
      const score = scoreValues(values, query.metric, query.threshold);
      if (!Number.isFinite(score)) return null;
      const source = getNetworkSource(network);
      return {
        type: "network",
        rank: 0,
        networkId: network.id,
        label: getNetworkLabel(network, dataset),
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        networkKind: getRankingNetworkKind(network),
        aggregationGroupingKey: getNetworkAggregationGroupingKey(network),
        measureId: network.measureId,
        statisticId: network.statisticId,
        layerId: network.context.layerId ?? "none",
        score,
        nLinksUsed: values.length,
      };
    })
    .filter((row): row is NetworkRankingRow => Boolean(row));

  const rankedRows = sortRows(rows, query.metric)
    .slice(0, query.topN)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return { query, rows: rankedRows, totalEligibleItems: rows.length };
};

const getLinkKey = (a: string, b: string) => [a, b].sort().join("__");

export const computeLinkRanking = ({
  datasetContent: dataset,
  query,
  activeNodes,
  activeFilterMask,
}: CalculationContext): Omit<RankingResult, "id" | "createdAt"> => {
  const networks = resolveRankingNetworkCollection(dataset, query);
  const expanded = query.linkCollectionMode === "expanded" || networks.length <= 1;
  const allowAutoconnections =
    query.allowLinkRankingAutoconnections ??
    DEFAULT_LINK_RANKING_ALLOW_AUTOCONNECTIONS;
  const grouped = new Map<
    string,
    {
      sourceId: string;
      targetId: string;
      valuesByNetwork: Record<string, number>;
      valuesByLayer: Record<string, number[]>;
      values: number[];
      bestNetworkId?: string;
      bestLayerId?: string;
      bestValue?: number;
    }
  >();

  const rows: LinkRankingRow[] = [];
  networks.forEach((network) => {
    const endpoints = resolveNetworkEndpointIds(network);
    for (const edge of iterateNetworkValues(network)) {
      if (!allowAutoconnections && edge.i === edge.j) continue;
      if (!isFiniteNumber(edge.value)) continue;
      if (
        !isEligibleEdge(
          network,
          edge.i,
          edge.j,
          activeNodes,
          activeFilterMask,
        )
      ) {
        continue;
      }
      const sourceId = endpoints[edge.i];
      const targetId = endpoints[edge.j];
      if (!sourceId || !targetId) continue;
      const score = scoreValues([edge.value], query.metric, query.threshold);
      if (!Number.isFinite(score)) continue;

      if (expanded) {
        rows.push({
          type: "link",
          rank: 0,
          sourceId,
          targetId,
          endpointType: network.derivation?.type === "aggregation" ? "group" : "node",
          sourceLabel: getEndpointLabel(dataset, sourceId, network),
          targetLabel: getEndpointLabel(dataset, targetId, network),
          score,
          valuesByNetwork: { [network.id]: edge.value },
          valuesByLayer: { [network.context.layerId ?? "none"]: edge.value },
          bestNetworkId: network.id,
          bestLayerId: network.context.layerId ?? "none",
          nNetworksUsed: 1,
        });
        continue;
      }

      const key = getLinkKey(sourceId, targetId);
      const group =
        grouped.get(key) ??
        {
          sourceId,
          targetId,
          valuesByNetwork: {},
          valuesByLayer: {},
          values: [],
        };
      const layerId = network.context.layerId ?? "none";
      group.valuesByNetwork[network.id] = edge.value;
      group.valuesByLayer[layerId] = [...(group.valuesByLayer[layerId] ?? []), edge.value];
      group.values.push(edge.value);
      const comparable = Math.abs(edge.value);
      if (group.bestValue === undefined || comparable > Math.abs(group.bestValue)) {
        group.bestValue = edge.value;
        group.bestNetworkId = network.id;
        group.bestLayerId = network.context.layerId ?? "none";
      }
      grouped.set(key, group);
    }
  });

  if (!expanded) {
    grouped.forEach((group) => {
      const score = scoreValues(group.values, query.metric, query.threshold);
      if (!Number.isFinite(score)) return;
      rows.push({
        type: "link",
        rank: 0,
        sourceId: group.sourceId,
        targetId: group.targetId,
        endpointType: networks[0]?.derivation?.type === "aggregation" ? "group" : "node",
        sourceLabel: getEndpointLabel(dataset, group.sourceId, networks[0]),
        targetLabel: getEndpointLabel(dataset, group.targetId, networks[0]),
        score,
        valuesByNetwork: group.valuesByNetwork,
        valuesByLayer: Object.fromEntries(
          Object.entries(group.valuesByLayer).map(([layerId, values]) => [
            layerId,
            mean(values),
          ]),
        ),
        bestNetworkId: group.bestNetworkId,
        bestLayerId: group.bestLayerId,
        nNetworksUsed: group.values.length,
      });
    });
  }

  const rankedRows = sortRows(rows, query.metric)
    .slice(0, query.topN)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return { query, rows: rankedRows, totalEligibleItems: rows.length };
};

export const computeNodeRanking = ({
  datasetContent: dataset,
  query,
  activeNodes,
  activeFilterMask,
}: CalculationContext): Omit<RankingResult, "id" | "createdAt"> => {
  const networks = resolveRankingNetworkCollection(dataset, query).filter(
    (network) => network.derivation?.type !== "aggregation",
  );
  const allowAutoconnections =
    query.allowNodeRankingAutoconnections ??
    DEFAULT_NODE_RANKING_ALLOW_AUTOCONNECTIONS;
  const scores = new Map<string, number[]>();
  const addNodeScore = (nodeId: string | undefined, value: number) => {
    if (!nodeId) return;
    const values = scores.get(nodeId) ?? [];
    values.push(value);
    scores.set(nodeId, values);
  };

  networks.forEach((network) => {
    const endpoints = resolveNetworkEndpointIds(network);
    for (const edge of iterateNetworkValues(network)) {
      if (!allowAutoconnections && edge.i === edge.j) continue;
      if (!isFiniteNumber(edge.value)) continue;
      if (
        !isEligibleEdge(
          network,
          edge.i,
          edge.j,
          activeNodes,
          activeFilterMask,
        )
      ) {
        continue;
      }
      addNodeScore(endpoints[edge.i], edge.value);
      if (edge.i !== edge.j) {
        addNodeScore(endpoints[edge.j], edge.value);
      }
    }
  });

  const rows: NodeRankingRow[] = Array.from(scores.entries())
    .map(([nodeId, values]) => {
      const score = scoreValues(values, query.metric, query.threshold);
      return {
        type: "node" as const,
        rank: 0,
        nodeId,
        label: getEndpointLabel(dataset, nodeId),
        group: getEndpointGroup(dataset, nodeId),
        score,
        nIncidentLinks: values.length,
        meanValue: mean(values),
        maxValue: values.length ? Math.max(...values) : undefined,
      };
    })
    .filter((row) => Number.isFinite(row.score));

  const rankedRows = sortRows(rows, query.metric)
    .slice(0, query.topN)
    .map((row, index) => ({ ...row, rank: index + 1 }));
  return { query, rows: rankedRows, totalEligibleItems: rows.length };
};

export const computeRanking = (context: CalculationContext) => {
  if (context.query.target === "networks") return computeNetworkRanking(context);
  if (context.query.target === "links") return computeLinkRanking(context);
  return computeNodeRanking(context);
};
