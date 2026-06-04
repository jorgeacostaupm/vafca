import { isRecord, isScalarTagValue } from "@/utils/import/guards";
import { parseRoiImportRecord } from "@/utils/import/schemas/roiSchema";
import type {
  ConnectivityImportIssue,
  NormalizedImportInference,
  NormalizedMatrix,
  NormalizedRoi,
} from "@/utils/import/types";

type NormalizeRoisArgs = {
  roisPayload: unknown | null;
  matrices: NormalizedMatrix[];
  errors: ConnectivityImportIssue[];
  warnings: ConnectivityImportIssue[];
  inference: NormalizedImportInference;
  strict: boolean;
};

const getMatrixSize = (
  matrices: NormalizedMatrix[],
  errors: ConnectivityImportIssue[],
) => {
  const firstSize = matrices[0]?.data.length ?? 0;
  matrices.forEach((matrix) => {
    if (matrix.data.length !== firstSize) {
      errors.push({
        source: matrix.source,
        path: `${matrix.source}.data`,
        message: "All matrices in a dataset must have the same size.",
      });
    }
  });
  return firstSize;
};

const normalizeTags = (
  value: unknown,
  source: string,
  errors: ConnectivityImportIssue[],
) => {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    errors.push({
      source,
      path: `${source}.tags`,
      message: "ROI tags must be an object.",
    });
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, tagValue]) => isScalarTagValue(tagValue)),
  ) as NormalizedRoi["tags"];
};

const generatedRoi = (index: number): NormalizedRoi => ({
  index,
  id: `roi-${index + 1}`,
  label: `ROI-${index + 1}`,
  name: `ROI-${index + 1}`,
  tags: {},
  metadata: {},
});

export const normalizeRois = ({
  roisPayload,
  matrices,
  errors,
  warnings,
  inference,
  strict,
}: NormalizeRoisArgs): NormalizedRoi[] => {
  const size = getMatrixSize(matrices, errors);
  if (size === 0) return [];

  if (roisPayload === null) {
    const rois = Array.from({ length: size }, (_, index) => generatedRoi(index));
    inference.generatedRois = true;
    inference.generatedRoiIds.push(...rois.map((roi) => roi.id));
    const issue = {
      source: "rois.json",
      path: "rois.json",
      message: "rois.json is missing; generated generic ROI labels from matrix size.",
    };
    if (strict) errors.push(issue);
    else warnings.push(issue);
    return rois;
  }

  if (!Array.isArray(roisPayload)) {
    errors.push({
      source: "rois.json",
      path: "rois.json",
      message: "rois.json must contain an array of ROI objects.",
    });
    return [];
  }

  const seenIndexes = new Set<number>();
  const rois = roisPayload.flatMap((roi, position) => {
    const source = `rois.json[${position}]`;
    const record = parseRoiImportRecord(roi, source, errors);
    if (!record) {
      return [];
    }

    const index = record.index;
    if (index >= size) {
      errors.push({
        source,
        path: `${source}.index`,
        message: `ROI index must be lower than matrix size ${size}.`,
      });
    }
    if (seenIndexes.has(index)) {
      errors.push({
        source,
        path: `${source}.index`,
        message: `Duplicate ROI index '${index}'.`,
      });
    }
    seenIndexes.add(index);

    const label = typeof record.label === "string" && record.label.trim()
      ? record.label.trim()
      : `ROI-${index + 1}`;
    const name = typeof record.name === "string" && record.name.trim()
      ? record.name.trim()
      : label;
    const id = typeof record.id === "string" && record.id.trim()
      ? record.id.trim()
      : `roi-${index + 1}`;

    if (!record.id) inference.generatedRoiIds.push(id);
    if (strict && !record.id) {
      errors.push({
        source,
        path: `${source}.id`,
        message: "Strict import requires each ROI to define id.",
      });
    }

    return [{
      index,
      id,
      label,
      name,
      tags: normalizeTags(record.tags, source, errors),
      metadata: record.metadata ?? {},
    }];
  });

  for (let index = 0; index < size; index += 1) {
    if (!seenIndexes.has(index)) {
      errors.push({
        source: "rois.json",
        path: "rois.json",
        message: `ROI indexes must cover 0..${size - 1}; missing index ${index}.`,
      });
      break;
    }
  }

  return [...rois].sort((left, right) => left.index - right.index);
};
