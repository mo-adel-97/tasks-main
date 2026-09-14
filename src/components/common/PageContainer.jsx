import React from 'react';
import { Box } from '@mui/material';
import { designTokens } from '../../config/designTokens';

export const pageContainerSx = {
  minWidth: 0,
  maxWidth: '100%',
  minHeight: 0,
  padding: designTokens.pageGutter,
  boxSizing: 'border-box',
  // Embedded screens share their host's gutter rather than adding another one.
  '& [data-page-container]': { padding: 0 },
};

export default React.forwardRef(function PageContainer({ sx, children, ...props }, ref) {
  return <Box ref={ref} data-page-container="true" {...props}
    sx={[...(Array.isArray(sx) ? sx : [sx]), pageContainerSx]}>{children}</Box>;
});
