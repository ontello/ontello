import React, { forwardRef, useEffect, useRef } from 'react';
import { amountInput } from './AmountInput.css';

interface AmountInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, placeholder = '0', disabled = false }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      if (measureRef.current && inputRef.current) {
        // Measure the text width
        measureRef.current.textContent = value || placeholder || '0';
        const width = measureRef.current.offsetWidth;

        // Set the input width with some padding
        inputRef.current.style.width = `${Math.min(Math.max(width + 10, 30), 300)}px`;
      }
    }, [value, placeholder]);
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        e.key === 'Backspace' ||
        e.key === 'Delete' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Tab' ||
        e.key === 'Enter' ||
        e.key === 'Escape' ||
        (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))
      ) {
        return;
      }

      if (!/[0-9.]/.test(e.key)) {
        e.preventDefault();
        return;
      }

      if (e.key === '.' && e.currentTarget.value.includes('.')) {
        e.preventDefault();
        return;
      }

      // Check decimal places limit (5 decimals max)
      if (/[0-9]/.test(e.key)) {
        const currentValue = e.currentTarget.value;
        const decimalIndex = currentValue.indexOf('.');
        if (decimalIndex !== -1) {
          const decimals = currentValue.substring(decimalIndex + 1);
          const selectionStart = e.currentTarget.selectionStart || 0;
          if (decimals.length >= 5 && selectionStart > decimalIndex) {
            e.preventDefault();
            // return;
          }
        }
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      let filtered = newValue.replace(/[^0-9.]/g, '');

      // Ensure only one decimal point
      const parts = filtered.split('.');
      if (parts.length > 2) {
        filtered = `${parts[0]}.${parts.slice(1).join('')}`;
      }

      // Limit to 5 decimal places
      if (parts.length === 2 && parts[1].length > 5) {
        filtered = `${parts[0]}.${parts[1].substring(0, 5)}`;
      }

      // Create a new event with the filtered value
      if (filtered !== newValue) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: filtered },
        };
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      } else {
        onChange(e);
      }
    };

    return (
      <>
        <span
          ref={measureRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            fontSize: '22px',
            fontWeight: '500',
            fontFamily: "'Inter', sans-serif",
            whiteSpace: 'pre',
          }}
        />
        <input
          ref={(el) => {
            inputRef.current = el;
            if (typeof ref === 'function') {
              ref(el);
            } else if (ref && 'current' in ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
            }
          }}
        type="text"
        inputMode="decimal"
        className={amountInput}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        name="amount"
        autoComplete="off"
        />
      </>
    );
  }
);

AmountInput.displayName = 'AmountInput';
