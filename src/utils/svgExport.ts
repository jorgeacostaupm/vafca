import type {
  RasterFormat,
  SvgExportOptions,
} from "@/types/svgExport";

const STYLE_PROPERTIES = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "opacity",
  "paint-order",
  "shape-rendering",
  "vector-effect",
  "stop-color",
  "stop-opacity",
  "font",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "letter-spacing",
  "text-anchor",
  "dominant-baseline",
];

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";


export const sanitizeFileName = (value: string) => {
  const normalized = value.normalize("NFKD").replace(/[^\w.\- ]+/g, "");
  const trimmed = normalized.trim().replace(/\s+/g, "-");
  const collapsed = trimmed.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return collapsed.length > 0 ? collapsed.slice(0, 120) : "chart";
};

const setInlineStyles = (source: Element, target: Element) => {
  const computed = window.getComputedStyle(source);
  const declarations = STYLE_PROPERTIES.map(
    (property) => `${property}:${computed.getPropertyValue(property)}`,
  ).join(";");
  if (declarations.length > 0) {
    target.setAttribute("style", declarations);
  }
};

export const cloneSvgWithStyles = (svg: SVGSVGElement) => {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", SVG_NS);
  if (!clone.getAttribute("xmlns:xlink")) clone.setAttribute("xmlns:xlink", XLINK_NS);
  if (!clone.getAttribute("viewBox") && svg.viewBox.baseVal) {
    const { x, y, width, height } = svg.viewBox.baseVal;
    if (width && height) {
      clone.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    }
  }

  const sourceNodes = [svg, ...Array.from(svg.querySelectorAll("*"))];
  const targetNodes = [clone, ...Array.from(clone.querySelectorAll("*"))];
  sourceNodes.forEach((node, index) => {
    const target = targetNodes[index];
    if (!target) return;
    setInlineStyles(node, target);
  });

  return clone;
};

const serializeSvg = (svg: SVGSVGElement) => {
  const clone = cloneSvgWithStyles(svg);
  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svgMarkup}`;
};

const parseSize = (value: string | null) => {
  if (!value) return Number.NaN;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const getSvgSize = (svg: SVGSVGElement) => {
  let width = parseSize(svg.getAttribute("width"));
  let height = parseSize(svg.getAttribute("height"));
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    const viewBox = svg.viewBox.baseVal;
    if (viewBox?.width && viewBox?.height) {
      width = viewBox.width;
      height = viewBox.height;
    }
  }
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    const rect = svg.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
  }
  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const exportRaster = async (
  svg: SVGSVGElement,
  format: RasterFormat,
  options: { scale: number; background?: string; quality?: number; fileName: string },
) => {
  const svgString = serializeSvg(svg);
  const { width, height } = getSvgSize(svg);
  const scale = options.scale;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (options.background) {
    ctx.fillStyle = options.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const image = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to render SVG."));
    image.src = url;
  });

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(image, 0, 0);
  URL.revokeObjectURL(url);

  const mime = format === "png" ? "image/png" : "image/jpeg";
  const extension = format === "png" ? "png" : "jpg";
  const quality = format === "jpeg" ? options.quality ?? 0.92 : undefined;

  const output = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );
  if (!output) return;
  downloadBlob(output, `${options.fileName}.${extension}`);
};

export const exportSvgElement = async (svg: SVGSVGElement, options: SvgExportOptions) => {
  const safeName = sanitizeFileName(options.fileName);
  if (options.format === "svg") {
    const svgString = serializeSvg(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `${safeName}.svg`);
    return;
  }

  await exportRaster(svg, options.format, {
    scale: options.scale ?? 2,
    background: options.background,
    quality: options.quality,
    fileName: safeName,
  });
};
