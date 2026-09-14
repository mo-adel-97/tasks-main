import React from 'react';
import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function MobileHeader({ title = 'نظام الإدارة', open, onToggle, actions }) {
  return <AppBar position="fixed" elevation={0}>
    <Toolbar>
      <IconButton aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'} aria-expanded={open} onClick={onToggle}>
        {open ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
      </IconButton>
      <Typography component="h1" sx={{ flex: 1 }}>{title}</Typography>
      {actions}
    </Toolbar>
  </AppBar>;
}

export function DrawerHeader({ onClose }) {
  return <Toolbar sx={{ minHeight: 56, gap: 1, px: '12px', flexShrink: 0 }}>
    <Typography sx={{ flex: 1, fontSize: '0.875rem', fontWeight: 700 }}>القائمة الرئيسية</Typography>
    <IconButton aria-label="إغلاق القائمة" onClick={onClose} sx={{ color: 'inherit', width: 40, height: 40 }}>
      <CloseRoundedIcon />
    </IconButton>
  </Toolbar>;
}
