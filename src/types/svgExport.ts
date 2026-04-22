export type RasterFormat = "png" | "jpeg";

export type SvgExportFormat = "svg" | RasterFormat;

export type SvgExportOptions = {
  fileName: string;
  format: SvgExportFormat;
  scale?: number;
  background?: string;
  quality?: number;
};
