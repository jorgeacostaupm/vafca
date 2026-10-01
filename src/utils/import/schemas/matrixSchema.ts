import { z } from "zod";

import { addZodIssues } from "@/utils/import/schemas/importSchemaIssues";
import type { NetworkImportIssue } from "@/utils/import/types";

export const MatrixLayoutSchema = z.enum([
  "full",
  "upper_triangular",
  "lower_triangular",
]);

export const MatrixImportPayloadSchema = z.object({
  data: z.unknown(),
  dimensions: z.record(z.string(), z.string()),
  id: z.string(),
  label: z.string().optional(),
  layout: MatrixLayoutSchema.optional(),
  measure: z.string(),
  rois: z.unknown().optional(),
  source: z.string(),
  statistic: z.string(),
}).passthrough();

export type MatrixImportRecord = z.infer<typeof MatrixImportPayloadSchema>;

export const parseMatrixImportRecord = (
  payload: unknown,
  source: string,
  errors: NetworkImportIssue[],
): MatrixImportRecord | null => {
  const result = MatrixImportPayloadSchema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};
