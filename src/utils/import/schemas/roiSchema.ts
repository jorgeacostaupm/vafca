import { z } from "zod";

import { addZodIssues } from "@/utils/import/schemas/importSchemaIssues";
import type { ConnectivityImportIssue } from "@/utils/import/types";

export const RoiImportSchema = z.object({
  id: z.string().optional(),
  index: z.number().int().nonnegative(),
  label: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  name: z.string().optional(),
  tags: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const RoiImportListSchema = z.array(RoiImportSchema);

export type RoiImportRecord = z.infer<typeof RoiImportSchema>;

export const parseRoiImportRecord = (
  payload: unknown,
  source: string,
  errors: ConnectivityImportIssue[],
): RoiImportRecord | null => {
  const result = RoiImportSchema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};

export const parseRoiImportList = (
  payload: unknown,
  source: string,
  errors: ConnectivityImportIssue[],
): RoiImportRecord[] | null => {
  const result = RoiImportListSchema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};
