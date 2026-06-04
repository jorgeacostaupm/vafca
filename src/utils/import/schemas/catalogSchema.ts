import { z } from "zod";

import { addZodIssues } from "@/utils/import/schemas/importSchemaIssues";
import type { ConnectivityImportIssue } from "@/utils/import/types";

export const CatalogsImportSchema = z.record(z.string(), z.unknown());

export type CatalogsImportRecord = z.infer<typeof CatalogsImportSchema>;

export const parseCatalogsImportRecord = (
  payload: unknown,
  source: string,
  errors: ConnectivityImportIssue[],
): CatalogsImportRecord | null => {
  const result = CatalogsImportSchema.safeParse(payload);

  if (!result.success) {
    addZodIssues(result.error.issues, source, errors);
    return null;
  }

  return result.data;
};
