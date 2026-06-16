import type { z } from "zod";

import type { NetworkImportIssue } from "@/utils/import/types";

export const addZodIssues = (
  zodIssues: z.core.$ZodIssue[],
  source: string,
  errors: NetworkImportIssue[],
) => {
  zodIssues.forEach((issue) => {
    const issuePath = issue.path.length > 0
      ? `${source}.${issue.path.map(String).join(".")}`
      : source;

    errors.push({
      source,
      path: issuePath,
      message: issue.message,
    });
  });
};
