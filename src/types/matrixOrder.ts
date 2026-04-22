export type MatrixOrderItem =
  | string
  | number
  | {
      id?: string;
      label?: string;
      name?: string;
      value?: string;
    };

export type MatrixOrderEntry = {
  id: string;
  label: string;
  acronym?: string;
};
