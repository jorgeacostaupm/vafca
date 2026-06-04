import { useEffect, useRef, useState } from "react";

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
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      setSize((prev) => {
        const next = { width: rect.width, height: rect.height };
        if (prev?.width === next.width && prev.height === next.height) {
          return prev;
        }
        return next;
      });
    };

    const scheduleUpdate = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(updateSize, debounceMs);
    };

    updateSize();
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(element);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      observer.disconnect();
    };
  }, [debounceMs]);

  return (
    <div ref={containerRef} className="resizable-container">
      {size ? children(size) : null}
    </div>
  );
}
