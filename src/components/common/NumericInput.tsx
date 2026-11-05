import React, { useState, useEffect } from 'react';

export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | null | undefined;
  onChange: (val: number | any) => void;
  onNullChange?: (val: number | null) => void;
  allowNull?: boolean;
  defaultValue?: number;
  fallbackValue?: number;
  className?: string;
  step?: number | string;
  min?: number | string;
  max?: number | string;
  placeholder?: string;
}

/**
 * Robust numeric input component for engineering calculations.
 * - Allows typing decimals smoothly (does not swallow dots or reset while typing).
 * - Accepts comma (,) as well as dot (.) for decimal point.
 * - Allows clearing the field and typing 0 or starting with 0.
 * - Mobile-friendly with inputMode="decimal".
 */
export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  onNullChange,
  allowNull = false,
  defaultValue,
  fallbackValue,
  className = '',
  step,
  min,
  max,
  placeholder,
  ...rest
}) => {
  const defaultVal = fallbackValue ?? defaultValue ?? 0;
  const [text, setText] = useState<string>(() =>
    value !== null && value !== undefined && !isNaN(Number(value)) ? String(value) : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // Synchronize when external value changes and input is not being actively typed in
  useEffect(() => {
    if (!isFocused) {
      setText(value !== null && value !== undefined && !isNaN(Number(value)) ? String(value) : '');
    }
  }, [value, isFocused]);

  const emitChange = (val: number | null) => {
    if (val === null) {
      if (onNullChange) {
        onNullChange(null);
      }
      if (allowNull) {
        onChange(null);
      } else {
        onChange(defaultVal);
      }
    } else {
      if (onNullChange) {
        onNullChange(val);
      }
      onChange(val);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');

    // Prevent negative sign if min >= 0
    if (min !== undefined && Number(min) >= 0 && raw.includes('-')) {
      return;
    }

    // Only allow valid number fragments: optional minus, digits, at most one dot
    if (!/^-?\d*\.?\d*$/.test(raw)) {
      return;
    }

    setText(raw);

    // Empty or standalone minus
    if (raw.trim() === '' || raw === '-') {
      if (allowNull) {
        emitChange(null);
      } else {
        emitChange(defaultVal);
      }
      return;
    }

    // Mid-typing trailing dot (e.g. "0." or "12.")
    if (raw.endsWith('.')) {
      const parsed = parseFloat(raw.slice(0, -1));
      if (!isNaN(parsed)) {
        emitChange(parsed);
      }
      return;
    }

    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      emitChange(parsed);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const raw = e.target.value.trim().replace(',', '.');

    if (raw === '' || raw === '-') {
      if (allowNull) {
        setText('');
        emitChange(null);
      } else {
        setText(String(defaultVal));
        emitChange(defaultVal);
      }
      return;
    }

    const parsed = parseFloat(raw);
    if (isNaN(parsed)) {
      if (allowNull) {
        setText('');
        emitChange(null);
      } else {
        setText(String(defaultVal));
        emitChange(defaultVal);
      }
    } else {
      let finalVal = parsed;
      if (min !== undefined && !isNaN(Number(min)) && finalVal < Number(min)) {
        finalVal = Number(min);
      }
      if (max !== undefined && !isNaN(Number(max)) && finalVal > Number(max)) {
        finalVal = Number(max);
      }
      setText(String(finalVal));
      emitChange(finalVal);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      {...rest}
    />
  );
};
