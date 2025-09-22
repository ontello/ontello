import { style } from '@vanilla-extract/css';

export const copyIcon = style({
  cursor: 'pointer',
  marginLeft: '4px',

  selectors: {
    '&:hover, &:focus-visible': {
      opacity: 0.8,
    },
  },
});
