import { style } from '@vanilla-extract/css';
import { DefaultReset, color, config } from 'folds';

export const amountInput = style([
  DefaultReset,
  {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '24px',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    color: color.Surface.OnContainer,
    padding: 0,
    margin: 0,
    lineHeight: 1,
    WebkitAppearance: 'none',
    MozAppearance: 'textfield',
    appearance: 'none',

    ':focus': {
      outline: 'none',
      border: 'none',
      boxShadow: 'none',
    },

    ':disabled': {
      opacity: config.opacity.Disabled,
      cursor: 'not-allowed',
    },

    '::placeholder': {
      color: color.Surface.OnContainer,
      opacity: 0.5,
    },

    selectors: {
      '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
        WebkitAppearance: 'none',
        margin: 0,
      },
    },

    '@media': {
      '(max-width: 768px)': {
        fontSize: '36px',
      },
    },
  },
]);
