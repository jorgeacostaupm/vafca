import type { z } from "zod";

import type { ConnectivityImportIssue } from "@/utils/import/types";

export const addZodIssues = (
  zodIssues: z.core.$ZodIssue[],
  source: string,
  errors: ConnectivityImportIssue[],
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
