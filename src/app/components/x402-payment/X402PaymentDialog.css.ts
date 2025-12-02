import { style } from '@vanilla-extract/css';
import { DefaultReset, color, config } from 'folds';

export const Dialog = style([
  DefaultReset,
  {
    minWidth: '380px',
    maxWidth: '520px',
  },
]);

export const Header = style([
  DefaultReset,
  {
    paddingLeft: config.space.S300,
    paddingRight: config.space.S300,
    borderBottomWidth: config.borderWidth.B300,
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
  },
]);

export const Content = style([
  DefaultReset,
  {
    padding: config.space.S400,
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S300,
  },
]);

export const Section = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
    backgroundColor: color.Surface.Container,
    borderRadius: config.radii.R400,
    padding: config.space.S300,
  },
]);

export const LabelRow = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: config.space.S200,
  },
]);

export const Tag = style([
  DefaultReset,
  {
    padding: `${config.space.S0} ${config.space.S200}`,
    borderRadius: config.radii.R300,
    backgroundColor: color.Primary.Container,
    color: color.Primary.OnContainer,
    fontSize: config.fontSize.B300,
    fontWeight: 600,
  },
]);

export const LinkRow = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S100,
    flexWrap: 'wrap',
  },
]);

export const LinkText = style([
  DefaultReset,
  {
    flex: 1,
    minWidth: '0',
    wordBreak: 'break-all',
  },
]);

export const Actions = style([
  DefaultReset,
  {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: config.space.S200,
    marginTop: config.space.S200,
  },
]);

export const Helper = style([
  DefaultReset,
  {
    color: color.Surface.OnContainer,
  },
]);
