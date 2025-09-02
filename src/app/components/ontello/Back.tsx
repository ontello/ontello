import React from 'react';
import { Box } from 'folds';
import backIcon from '../../static/icons/svgs/back.svg';

export function Back({
  onClick,
  children,
  style,
}: {
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Box gap="100" style={{ position: 'relative', ...style }}>
      <Box
        shrink="No"
        grow="No"
        onClick={onClick}
        style={{
          cursor: 'pointer',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
        }}
      >
        <img src={backIcon} alt="back" style={{ width: '15px' }} />
      </Box>

      <Box shrink="Yes" grow="Yes">
        {children}
      </Box>
    </Box>
  );
}
