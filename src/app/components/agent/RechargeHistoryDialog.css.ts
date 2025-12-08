import { style } from '@vanilla-extract/css';
import { DefaultReset, config, toRem } from 'folds';

export const Dialog = style([
  DefaultReset,
  {
    minWidth: toRem(420),
    maxWidth: toRem(560),
    minHeight: toRem(370),
  },
]);

export const Header = style([
  DefaultReset,
  {
    padding: config.space.S300,
    borderBottomWidth: config.borderWidth.B300,
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
  },
]);

export const Content = style([
  DefaultReset,
  {
    padding: config.space.S300,
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
  },
]);

export const List = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
  },
]);

export const Item = style([
  DefaultReset,
  {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    alignItems: 'center',
    padding: `${config.space.S200} ${config.space.S200}`,
    borderRadius: config.radii.R300,
  },
]);

export const ItemHeader = style([
  DefaultReset,
  {
    fontWeight: 600,
  },
]);
