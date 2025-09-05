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
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const char = String.fromCharCode(e.which);
      const currentValue = e.currentTarget.value;
      
      if (!/[0-9.]/.test(char)) {
        e.preventDefault();
        return;
      }
      
      if (char === '.' && currentValue.includes('.')) {
        e.preventDefault();
        return;
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={amountInput}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  }
);

AmountInput.displayName = 'AmountInput';