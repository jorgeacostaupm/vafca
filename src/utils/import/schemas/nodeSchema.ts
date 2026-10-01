import { z } from "zod";

import { addZodIssues } from "@/utils/import/schemas/importSchemaIssues";
import type { NetworkImportIssue } from "@/utils/import/types";

const NodeCoordinatesSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  space: z.string().optional(),
});


export const NodeImportSchema = z.object({
  atlasId: z.union([z.string(), z.number()]).optional(),
  coords: NodeCoordinatesSchema.nullable().optional(),
  id: z.string().optional(),
  index: z.number().int().nonnegative(),
  label: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  name: z.string().optional(),
  tags: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const NodeImportListSchema = z.array(NodeImportSchema);

export type NodeImportRecord = z.infer<typeof NodeImportSchema>;

export const parseNodeImportRecord = (
  payload: unknown,
  source: string,
  errors: NetworkImportIssue[],
): NodeImportRecord | null => {
  const result = NodeImportSchema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};

export const parseNodeImportList = (
  payload: unknown,
  source: string,
  errors: NetworkImportIssue[],
): NodeImportRecord[] | null => {
  const result = NodeImportListSchema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};
