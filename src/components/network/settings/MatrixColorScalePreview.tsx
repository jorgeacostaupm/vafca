import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

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
import type { ScaleType } from "@/types/connectivityBundle";
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
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updateWidth = () => {
      setContainerWidth(wrapper.getBoundingClientRect().width);
    };
    updateWidth();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerWidth(entry?.contentRect.width ?? 0);
    });
    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svgWidth =
      containerWidth > 0
        ? containerWidth
        : MATRIX_COLOR_PREVIEW_MIN_LENGTH +
          MATRIX_COLOR_PREVIEW_HORIZONTAL_PADDING * 2;
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
    });
  }, [containerWidth, scaleType, settings]);

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
