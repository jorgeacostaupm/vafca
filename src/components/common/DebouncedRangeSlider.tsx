import {
  Slider,
} from "antd";
import type { SliderRangeProps } from "antd/es/slider";
import { useEffect, useRef, useState } from "react";

type RangeValue = [number, number];

type DebouncedRangeSliderProps = Omit<
  SliderRangeProps,
  "range" | "value" | "onChange"
> & {
  range?: boolean;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  debounceMs?: number;
};

function DebouncedRangeSlider({
  value,
  onChange,
  debounceMs = 180,
  ...sliderProps
}: DebouncedRangeSliderProps) {
  const [internalValue, setInternalValue] = useState<RangeValue>(value);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (nextValue: number[]) => {
    if (nextValue.length < 2) return;
    const normalized: RangeValue = [nextValue[0], nextValue[1]];
    setInternalValue(normalized);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      onChange(normalized);
    }, debounceMs);
  };

  return (
    <Slider
      {...sliderProps}
      range
      value={internalValue}
      onChange={handleChange}
    />
  );
}

export default DebouncedRangeSlider;
