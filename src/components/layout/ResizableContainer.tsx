import { useEffect, useRef, useState } from "react";

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
  const [size, setSize] = useState<Size>({ width: 320, height: 320 });
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setSize((prev) => {
        const next = { width: rect.width, height: rect.height };
        if (prev.width === next.width && prev.height === next.height) {
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
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
    >
      {children(size)}
    </div>
  );
}
