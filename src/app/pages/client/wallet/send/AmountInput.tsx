import React, { forwardRef } from 'react';
import { amountInput } from './AmountInput.css';

interface AmountInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, placeholder = '0', disabled = false }, ref) => {
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
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={amountInput}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        name="amount"
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';
