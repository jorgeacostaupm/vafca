import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Size = { width: number; height: number };

type ResizableContainerProps = {
  children: (size: Size) => React.ReactNode;
  debounceMs?: number;
};

export default function ResizableContainer({
  children,
  debounceMs = 100,
}: ResizableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size | null>(null);
  const debounceRef = useRef<number | null>(null);

  const updateSize = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    setSize((prev) => {
      const next = { width: rect.width, height: rect.height };
      if (prev && prev.width === next.width && prev.height === next.height) {
        return prev;
      }
      return next;
    });
  }, []);

  useLayoutEffect(() => {
    updateSize();
  }, [updateSize]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const scheduleUpdate = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(updateSize, debounceMs);
    };

    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(element);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      observer.disconnect();
    };
  }, [debounceMs, updateSize]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      {size ? children(size) : null}
    </div>
  );
}
