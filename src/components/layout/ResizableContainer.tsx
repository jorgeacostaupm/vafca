import { useLayoutEffect, useRef, useState } from "react";

import { DEFAULT_RESIZABLE_CONTAINER_DEBOUNCE_MS } from "@/config/ui";

type Size = { width: number; height: number };

type ResizableContainerProps = {
  children: (size: Size) => React.ReactNode;
  debounceMs?: number;
};

export default function ResizableContainer({
  children,
  debounceMs = DEFAULT_RESIZABLE_CONTAINER_DEBOUNCE_MS,
}: ResizableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let debounceId: number | null = null;
    let frameId: number | null = null;

    const clearScheduledUpdate = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      if (debounceId !== null) {
        window.clearTimeout(debounceId);
        debounceId = null;
      }
    };

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        setSize(null);
        return;
      }

      const next = { width: rect.width, height: rect.height };
      setSize((prev) => {
        if (prev?.width === next.width && prev.height === next.height) {
          return prev;
        }
        return next;
      });
    };

    const scheduleUpdate = (delayMs = debounceMs) => {
      clearScheduledUpdate();
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        debounceId = window.setTimeout(() => {
          debounceId = null;
          updateSize();
        }, delayMs);
      });
    };

    updateSize();
    const resizeObserver = new ResizeObserver(() => scheduleUpdate());
    resizeObserver.observe(element);
    const intersectionObserver =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              scheduleUpdate(0);
            }
          });
    intersectionObserver?.observe(element);

    return () => {
      clearScheduledUpdate();
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, [debounceMs]);

  return (
    <div ref={containerRef} className="resizable-container">
      {size ? children(size) : null}
    </div>
  );
}
