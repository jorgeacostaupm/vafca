import { InputNumber, Slider } from "antd";
import type { SliderRangeProps } from "antd/es/slider";
import { useEffect, useRef, useState } from "react";

import { RANGE_FILTER_DEBOUNCE_MS } from "@/config/ui";

type RangeValue = [number, number];
type DebouncedRangeSliderProps = Omit<SliderRangeProps, "range" | "value" | "onChange"> & {
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  debounceMs?: number;
  label: string;
};

export default function DebouncedRangeSlider({
  value, onChange, label, debounceMs = RANGE_FILTER_DEBOUNCE_MS, ...sliderProps
}: DebouncedRangeSliderProps) {
  const [internalValue, setInternalValue] = useState<RangeValue>(value);
  const [draft, setDraft] = useState<[number | null, number | null]>(value);
  const timeoutRef = useRef<number | null>(null);

  const [previousValue, setPreviousValue] = useState(value);
  const [previousDisabled, setPreviousDisabled] = useState(sliderProps.disabled);
  if (previousValue !== value || previousDisabled !== sliderProps.disabled) {
    setPreviousValue(value);
    setPreviousDisabled(sliderProps.disabled);
    setInternalValue(value);
    setDraft(value);
  }

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, [value, sliderProps.disabled]);

  const handleChange = (nextValue: number[]) => {
    const normalized: RangeValue = [nextValue[0], nextValue[1]];
    setInternalValue(normalized);
    setDraft(normalized);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => onChange(normalized), debounceMs);
  };

  const commitNumber = (index: 0 | 1) => {
    const number = draft[index];
    if (number === null || !Number.isFinite(number)) {
      setDraft(internalValue);
      return;
    }
    const min = index === 0 ? (sliderProps.min ?? 0) : internalValue[0];
    const max = index === 1 ? (sliderProps.max ?? 100) : internalValue[1];
    const next: RangeValue = [...internalValue];
    next[index] = Math.min(max, Math.max(min, number));
    handleChange(next);
  };

  return (
    <div>
      <Slider {...sliderProps} range value={internalValue} onChange={handleChange} />
      <div className="network-range-filter__inputs">
        {([0, 1] as const).map((index) => (
          <label key={index}>
            {index === 0 ? "Min" : "Max"}
            <InputNumber
              aria-label={`${label} ${index === 0 ? "minimum" : "maximum"}`}
              value={draft[index]}
              min={index === 0 ? sliderProps.min : internalValue[0]}
              max={index === 1 ? sliderProps.max : internalValue[1]}
              step={sliderProps.step ?? undefined}
              disabled={sliderProps.disabled}
              onChange={(number) => setDraft((current) => index === 0 ? [number, current[1]] : [current[0], number])}
              onBlur={() => commitNumber(index)}
              onPressEnter={(event) => event.currentTarget.blur()}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
