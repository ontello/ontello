import React from 'react';
import { Box } from 'folds';
import BackSvg from '../../static/icons/svgComponents/back';

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
          width: '15.5px',
        }}
      >
        <BackSvg />
      </Box>

      <Box shrink="Yes" grow="Yes">
        {children}
      </Box>
    </Box>
  );
}
