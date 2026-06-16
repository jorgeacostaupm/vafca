import type {
  BuildCategoryOrderEditorsArgs,
  CategoryOrderEditor,
  CategoryOrderMap,
  MoveDirection,
} from "@/components/management/types";
import { getNodeFieldValue, normalizeNodeFieldValue } from "@/utils/atlas/atlasDefinition";
import { buildCircularCategoryOrderKey } from "@/utils/circular/hierarchy";

const moveItem = (
  values: string[],
  value: string,
  direction: MoveDirection,
): string[] => {
  const index = values.indexOf(value);
  if (index < 0) return values;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= values.length) return values;

  const next = [...values];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const moveField = (
  fields: string[],
  field: string,
  direction: MoveDirection,
): string[] => moveItem(fields, field, direction);

export const moveValue = (
  values: string[],
  value: string,
  direction: MoveDirection,
): string[] => moveItem(values, value, direction);

export const reverseValues = (values: string[]) => [...values].reverse();

export const buildCategoryOrderEditors = ({
  atlasDefinition,
  hierarchyFields,
  categoryOrder,
  sourceIds,
}: BuildCategoryOrderEditorsArgs): CategoryOrderEditor[] => {
  if (!atlasDefinition?.nodes?.length || hierarchyFields.length === 0) {
    return [];
  }

  const nodeById = new Map(
    atlasDefinition.nodes.flatMap((node) => [
      [String(node.id), node] as const,
      [String(node.atlasId), node] as const,
    ]),
  );

  const editorMap = new Map<
    string,
    {
      field: string;
      parentValues: string[];
      values: Set<string>;
    }
  >();

  sourceIds.forEach((nodeId) => {
    const node = nodeById.get(nodeId);
    if (!node) return;

    const parentValues: string[] = [];
    hierarchyFields.forEach((field, fieldIndex) => {
      const orderKey = buildCircularCategoryOrderKey(fieldIndex, parentValues);
      if (!editorMap.has(orderKey)) {
        editorMap.set(orderKey, {
          field,
          parentValues: [...parentValues],
          values: new Set<string>(),
        });
      }
      const value = normalizeNodeFieldValue(getNodeFieldValue(node, field));
      editorMap.get(orderKey)?.values.add(value);
      parentValues.push(value);
    });
  });

  return Array.from(editorMap.entries())
    .map(([key, entry]) => {
      const availableValues = Array.from(entry.values).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
      const configured = categoryOrder[key] ?? [];
      const configuredSet = new Set(configured);
      const ordered = [
        ...configured.filter((value) => entry.values.has(value)),
        ...availableValues.filter((value) => !configuredSet.has(value)),
      ];

      return {
        key,
        field: entry.field,
        parentValues: entry.parentValues,
        values: ordered,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key, undefined, { sensitivity: "base" }));
};

export const toCleanCategoryOrderMap = (
  editors: CategoryOrderEditor[],
): CategoryOrderMap =>
  editors.reduce<CategoryOrderMap>((acc, editor) => {
    if (editor.values.length > 0) {
      acc[editor.key] = editor.values;
    }
    return acc;
  }, {});

export const areCategoryOrdersEqual = (
  current: CategoryOrderMap,
  next: CategoryOrderMap,
): boolean => {
  const currentKeys = Object.keys(current).sort();
  const nextKeys = Object.keys(next).sort();

  const sameKeys =
    currentKeys.length === nextKeys.length &&
    currentKeys.every((key, index) => key === nextKeys[index]);
  if (!sameKeys) return false;

  return nextKeys.every((key) => {
    const a = current[key] ?? [];
    const b = next[key] ?? [];
    return a.length === b.length && a.every((value, index) => value === b[index]);
  });
};
