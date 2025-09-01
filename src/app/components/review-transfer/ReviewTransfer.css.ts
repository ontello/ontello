import { style } from '@vanilla-extract/css';
import { DefaultReset, color, config } from 'folds';

export const ReviewTransferDialog = style([
  DefaultReset,
  {
    minWidth: '320px',
    maxWidth: '420px',
  },
]);

export const Header = style([
  DefaultReset,
  {
    paddingLeft: config.space.S200,
    paddingRight: config.space.S200,
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
    gap: config.space.S400,
  },
]);

export const TokenSection = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S400,
  },
]);

export const TokenIcon = style([
  DefaultReset,
  {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  },
]);

export const TokenIconImg = style([
  DefaultReset,
  {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
]);

export const TokenInfo = style([
  DefaultReset,
  {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S100,
  },
]);

export const TokenValue = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: config.space.S100,
  },
]);

export const Section = style([
  DefaultReset,
  {
    backgroundColor: color.SurfaceVariant.Container,
    borderRadius: config.radii.R400,
    padding: config.space.S400,
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
  },
]);

export const SectionHeader = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
]);

export const RecipientTypeTag = style([
  DefaultReset,
  {
    color: color.Primary.Main,
    fontWeight: 'bold',
  },
]);

export const Recipient = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S300,
  },
]);

export const RecipientAvatar = style([
  DefaultReset,
  {
    width: '20px',
    height: '20px',
    borderRadius: config.radii.R300,
    overflow: 'hidden',
    flexShrink: 0,
  },
]);

export const RecipientAvatarImg = style([
  DefaultReset,
  {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
]);

export const RecipientInfo = style([
  DefaultReset,
  {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S100,
  },
]);

export const RecipientAddress = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
  },
]);

export const AddressText = style([
  DefaultReset,
  {
    fontFamily: 'JetBrains Mono, monospace',
    color: color.SurfaceVariant.OnContainer,
  },
]);

export const Network = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
  },
]);

export const NetworkIcon = style([
  DefaultReset,
  {
    width: '18px',
    height: '18px',
    borderRadius: config.radii.R300,
    overflow: 'hidden',
    flexShrink: 0,
  },
]);

export const NetworkIconImg = style([
  DefaultReset,
  {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
]);

export const ErrorSection = style([
  DefaultReset,
  {
    backgroundColor: color.Critical.Container,
    borderRadius: config.radii.R400,
    padding: config.space.S400,
    border: `1px solid ${color.Critical.OnContainer}`,
  },
]);

export const ErrorText = style([
  DefaultReset,
  {
    color: color.Critical.Main,
  },
]);

export const Actions = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
    marginTop: config.space.S200,
  },
]);

export const ActionButton = style([
  DefaultReset,
  {
    width: '100%',
    minHeight: '48px',
    borderRadius: config.radii.R400,
  },
]);
