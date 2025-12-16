import { keyframes, style } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';
import { DefaultReset, color, config, toRem } from 'folds';

const ToastEnterAnime = keyframes({
  '0%': {
    opacity: 0,
    transform: `translateY(-${toRem(8)}) scale(0.98)`,
  },
  '100%': {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  },
});

export const ToastViewport = style([
  DefaultReset,
  {
    position: 'fixed',
    top: config.space.S200,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: config.zIndex.Max,
    width: `calc(100% - ${config.space.S400})`,
    maxWidth: toRem(420),
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S100,
    pointerEvents: 'none',
  },
]);

export const ToastItem = recipe({
  base: [
    DefaultReset,
    {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: config.space.S200,
      padding: config.space.S200,
      backgroundColor: color.Surface.Container,
      color: color.Surface.OnContainer,
      borderRadius: config.radii.R400,
      boxShadow: config.shadow.E200,
      border: `${config.borderWidth.B300} solid ${color.Surface.ContainerLine}`,
      overflow: 'hidden',
      pointerEvents: 'all',
      animation: `${ToastEnterAnime} 120ms ease-out`,
    },
  ],
  variants: {
    type: {
      info: {},
      success: {},
      warning: {},
      error: {},
    },
  },
  defaultVariants: {
    type: 'info',
  },
});

export const ToastAccent = recipe({
  base: [
    DefaultReset,
    {
      width: toRem(4),
      borderRadius: config.radii.R400,
      alignSelf: 'stretch',
      flexShrink: 0,
    },
  ],
  variants: {
    type: {
      info: {
        backgroundColor: color.Primary.Main,
      },
      success: {
        backgroundColor: color.Success.Main,
      },
      warning: {
        backgroundColor: color.Warning.Main,
      },
      error: {
        backgroundColor: color.Critical.Main,
      },
    },
  },
  defaultVariants: {
    type: 'info',
  },
});

export const ToastContent = style({
  minWidth: 0,
  flexGrow: 1,
});

export const ToastMessage = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
});
