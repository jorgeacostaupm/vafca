export const moveField = (
  fields: string[],
  field: string,
  direction: "up" | "down",
) => {
  const index = fields.indexOf(field);
  if (index < 0) return fields;

  const delta = direction === "up" ? -1 : 1;
  const target = index + delta;
  if (target < 0 || target >= fields.length) return fields;

  const next = [...fields];
  const current = next[index];
  const nextValue = next[target];
  if (!current || !nextValue) return fields;

  next[index] = nextValue;
  next[target] = current;
  return next;
};

export const normalizeUniqueFieldList = (
  fields: string[],
  allowedFields: string[],
) => {
  const seen = new Set<string>();
  const next: string[] = [];

  fields.forEach((field) => {
    if (seen.has(field)) return;
    if (!allowedFields.includes(field)) return;
    seen.add(field);
    next.push(field);
  });

  return next;
};

export const areStringArraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export const areStringMapsEqual = (
  a: Record<string, string>,
  b: Record<string, string>,
) => {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!(key in b)) return false;
    if (a[key] !== b[key]) return false;
  }

  return true;
};
