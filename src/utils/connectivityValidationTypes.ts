import type {
  ConnectivityValidationOptions,
  ValidationError,
  ValidationWarning,
} from "@/types/connectivityBundle";

export const DEFAULT_CONNECTIVITY_VALIDATION_OPTIONS: Required<ConnectivityValidationOptions> =
  {
    strict: true,
    strictValueRanges: true,
    allowMissingComparisonDependencies: false,
    allowTriangularLayout: true,
  };

export type IssueBucket = {
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export const createIssueBucket = (): IssueBucket => ({
  errors: [],
  warnings: [],
});

export const addError = (
  bucket: IssueBucket,
  path: string,
  message: string,
  code?: string,
) => bucket.errors.push({ path, message, code });

export const addWarning = (
  bucket: IssueBucket,
  path: string,
  message: string,
  code?: string,
) => bucket.warnings.push({ path, message, code });

export const resolveValidationOptions = (
  options: ConnectivityValidationOptions = {},
): Required<ConnectivityValidationOptions> => ({
  ...DEFAULT_CONNECTIVITY_VALIDATION_OPTIONS,
  ...options,
});
