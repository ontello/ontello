import { style } from '@vanilla-extract/css';
import { color, config } from 'folds';

export const actionButton = style({
  height: '52px',
  borderRadius: config.radii.R400,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',

  selectors: {
    '&:hover, &:focus-visible': {
      backgroundColor: color.SurfaceVariant.ContainerHover,
    },
  },
});
