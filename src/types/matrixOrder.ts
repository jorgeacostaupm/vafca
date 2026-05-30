export type MatrixOrderItem =
  | string
  | number
  | {
      id?: string;
      label?: string;
      name?: string;
      value?: string;
      acronym?: string;
      tags?: Record<string, string | number | boolean | null>;
      metadata?: Record<string, unknown>;
      [key: string]: unknown;
    };

export type MatrixOrderEntry = {
  id: string;
  label: string;
  name?: string;
  acronym?: string;
  tags?: Record<string, string | number | boolean | null>;
  metadata?: Record<string, unknown>;
};
