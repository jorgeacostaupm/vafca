import { z } from "zod";

import { addZodIssues } from "@/utils/import/schemas/importSchemaIssues";
import type { NetworkImportIssue, NetworkImportMode } from "@/utils/import/types";

export const MatrixLayoutSchema = z.enum([
  "full",
  "upper_triangular",
  "lower_triangular",
]);

export const MatrixImportPayloadSchema = z.object({
  comparison: z.record(z.string(), z.unknown()).optional(),
  data: z.unknown(),
  id: z.string().optional(),
  kind: z.enum(["population", "subject", "comparison"]).optional(),
  label: z.string().optional(),
  layer: z.string().optional(),
  layerId: z.string().optional(),
  layout: MatrixLayoutSchema.optional(),
  matrixType: MatrixLayoutSchema.optional(),
  measure: z.string().optional(),
  measureId: z.string().optional(),
  n: z.number().int().positive().optional(),
  name: z.string().optional(),
  population: z.string().optional(),
  populationId: z.string().optional(),
  populationIds: z.array(z.string()).optional(),
  rois: z.unknown().optional(),
  stat: z.string().optional(),
  statId: z.string().optional(),
  subject: z.string().optional(),
  subjectId: z.string().optional(),
  type: z.string().optional(),
}).passthrough();

const RawMatrixArraySchema = z.array(z.unknown()).transform((data) => ({ data }));

const LenientMatrixPayloadSchema = z.union([
  RawMatrixArraySchema,
  MatrixImportPayloadSchema,
]);

const StrictMatrixPayloadSchema = MatrixImportPayloadSchema;

export type MatrixImportRecord = z.infer<typeof MatrixImportPayloadSchema>;

export const parseMatrixImportRecord = (
  payload: unknown,
  mode: NetworkImportMode,
  source: string,
  errors: NetworkImportIssue[],
): MatrixImportRecord | null => {
  const schema = mode === "strict"
    ? StrictMatrixPayloadSchema
    : LenientMatrixPayloadSchema;
  const result = schema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};
