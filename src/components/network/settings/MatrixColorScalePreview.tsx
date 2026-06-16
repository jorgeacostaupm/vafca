import * as d3 from "d3";
import { useId, useLayoutEffect, useRef, useState } from "react";

import {
  createHeatmapColorResolver,
  renderHeatmapLegend,
} from "@/components/matrix/components/matrixLegend";
import {
  getMatrixScalePreviewDomain,
} from "@/config/matrixColorScales";
import {
  MATRIX_COLOR_LEGEND_THICKNESS,
  MATRIX_COLOR_PREVIEW_HEIGHT,
  MATRIX_COLOR_PREVIEW_HORIZONTAL_PADDING,
  MATRIX_COLOR_PREVIEW_MIN_LENGTH,
} from "@/config/ui";
import type { ScaleType } from "@/types/network";
import type { MatrixColorScaleSettings } from "@/types/visualizationUi";

type MatrixColorScalePreviewProps = {
  scaleType: ScaleType;
  settings: MatrixColorScaleSettings;
};

export default function MatrixColorScalePreview({
  scaleType,
  settings,
}: MatrixColorScalePreviewProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gradientId = `matrix-scale-preview-${useId().replace(/:/g, "")}`;
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateWidth = (width: number) =>
      setContainerWidth((currentWidth) => {
        const nextWidth = Math.max(0, Math.round(width));
        return currentWidth === nextWidth ? currentWidth : nextWidth;
      });

    updateWidth(wrapper.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      updateWidth(entry?.contentRect.width ?? 0);
    });
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!svgRef.current || containerWidth <= 0) return;
    const svgWidth = containerWidth;
    const legendLength = Math.max(
      svgWidth - MATRIX_COLOR_PREVIEW_HORIZONTAL_PADDING * 2,
      0,
    );

    const domain = getMatrixScalePreviewDomain(scaleType);
    const legendRange = {
      min: domain.min,
      max: domain.max,
    };
    const colorResolver = createHeatmapColorResolver({
      legendRange,
      scaleType,
      scaleCenter: domain.center,
      colorScaleSettings: settings,
    });

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const root = svg
      .append("g")
      .attr(
        "transform",
        `translate(${MATRIX_COLOR_PREVIEW_HORIZONTAL_PADDING}, 4)`,
      );

    renderHeatmapLegend({
      svg,
      root,
      length: legendLength,
      legendRange,
      colorResolver,
      discreteSteps: settings.discretize ? settings.discreteSteps : null,
      orientation: "horizontal",
      thickness: MATRIX_COLOR_LEGEND_THICKNESS,
      gradientId,
    });
  }, [containerWidth, gradientId, scaleType, settings]);

  const svgWidth =
    containerWidth > 0
      ? containerWidth
      : MATRIX_COLOR_PREVIEW_MIN_LENGTH +
        MATRIX_COLOR_PREVIEW_HORIZONTAL_PADDING * 2;

  return (
    <div ref={wrapperRef} className="matrix-settings-preview">
      <svg
        ref={svgRef}
        width="100%"
        height={MATRIX_COLOR_PREVIEW_HEIGHT}
        viewBox={`0 0 ${svgWidth} ${MATRIX_COLOR_PREVIEW_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      />
    </div>
  );
}
