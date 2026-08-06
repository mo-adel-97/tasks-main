import React from 'react';
import { Box } from '@mui/material';
import ProfileStatsTab from '../components/ProfileStatsTab';

export default function HomeTab() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        minHeight: '100vh',
        overflowX: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <ProfileStatsTab user={user} />
    </Box>
  );
}