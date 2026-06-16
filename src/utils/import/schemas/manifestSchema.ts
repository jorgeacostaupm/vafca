import { z } from "zod";

import { addZodIssues } from "@/utils/import/schemas/importSchemaIssues";
import type { NetworkImportIssue } from "@/utils/import/types";

export const ManifestImportSchema = z.object({
  atlasId: z.string().optional(),
  directedNetworks: z.boolean().optional(),
  formatVersion: z.string().optional(),
  name: z.string().optional(),
}).passthrough();

export type ManifestImportRecord = z.infer<typeof ManifestImportSchema>;

export const parseManifestImportRecord = (
  payload: unknown,
  source: string,
  errors: NetworkImportIssue[],
): ManifestImportRecord | null => {
  const result = ManifestImportSchema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};
