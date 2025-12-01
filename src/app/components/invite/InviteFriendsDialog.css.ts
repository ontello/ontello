import { style } from '@vanilla-extract/css';
import { DefaultReset, color, config } from 'folds';

export const InviteDialog = style([
  DefaultReset,
  {
    width: '100%',
    maxWidth: '420px',
    minWidth: '320px',
  },
]);

export const Header = style([
  DefaultReset,
  {
    paddingLeft: config.space.S300,
    paddingRight: config.space.S300,
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
    borderBottom: `1px solid ${color.Surface.ContainerLine}`,
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

export const Section = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
  },
]);

export const LinkRow = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
    padding: `${config.space.S200} ${config.space.S200}`,
    borderRadius: config.radii.R400,
    backgroundColor: color.SurfaceVariant.Container,
    border: `1px solid ${color.SurfaceVariant.ContainerLine}`,
  },
]);

export const LinkText = style([
  DefaultReset,
  {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
]);

export const CopyButton = style([
  DefaultReset,
  {
    minWidth: '76px',
    height: '36px',
  },
]);

export const Step = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
  },
]);

export const HistoryButton = style([
  DefaultReset,
  {
    width: '100%',
    padding: config.space.S300,
    borderRadius: config.radii.R400,
    backgroundColor: color.SurfaceVariant.Container,
    border: `1px solid ${color.SurfaceVariant.ContainerLine}`,
    display: 'flex',
    alignItems: 'center',
    gap: config.space.S200,
    justifyContent: 'center',
  },
]);

export const Highlight = style([
  DefaultReset,
  {
    color: color.Primary.Main,
  },
]);

export const HistoryDialog = style([
  DefaultReset,
  {
    width: '100%',
    maxWidth: '420px',
    minWidth: '320px',
  },
]);

export const HistoryHeader = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${config.space.S300} ${config.space.S400}`,
    borderBottom: `1px solid ${color.Surface.ContainerLine}`,
  },
]);

export const HistoryContent = style([
  DefaultReset,
  {
    padding: `${config.space.S300} ${config.space.S400} ${config.space.S400}`,
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
  },
]);

export const HistoryHeadings = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: config.space.S100,
  },
]);

export const HistoryList = style([
  DefaultReset,
  {
    display: 'flex',
    flexDirection: 'column',
    gap: config.space.S200,
    minHeight: '240px',
    maxHeight: '320px',
    overflowY: 'auto',
    paddingRight: config.space.S100,
  },
]);

export const HistoryEmpty = style([
  DefaultReset,
  {
    minHeight: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
]);

export const HistoryRow = style([
  DefaultReset,
  {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: config.space.S200,
  },
]);

export const HistoryInvitee = style([
  DefaultReset,
  {
    flex: 1,
    minWidth: 0,
  },
]);

export const HistoryDate = style([
  DefaultReset,
  {
    marginLeft: config.space.S200,
    whiteSpace: 'nowrap',
    textAlign: 'right',
    minWidth: '96px',
  },
]);
