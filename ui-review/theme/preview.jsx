import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CacheProvider } from '@emotion/react';
import { Box, Button, Dialog, DialogTitle, DialogContent, TextField, MenuItem, Paper } from '@mui/material';
import { createAppCache } from '../../src/theme';
import { ColorModeProvider } from '../../src/contexts/ColorModeContext';
import '../../src/index.css';

function Fixture() {
  const [open, setOpen] = useState(false);
  const [nested, setNested] = useState(false);
  return <><Box id="fixed" sx={{ position: 'fixed', right: 0, top: 0, width: 190, height: '100vh', bgcolor: '#034d31', color: 'white', p: 2 }}>القائمة الرئيسية</Box>
    <Box id="content" sx={{ mr: '190px', p: 3, minHeight: '200vh', bgcolor: '#f5f8f6' }}>
      <Paper sx={{ p: 3 }}><h1>متابعة الطلاب والسداد</h1><Button id="open" onClick={() => setOpen(true)}>إضافة متابعة</Button></Paper>
      <Box sx={{ p: 3, mt: 2, bgcolor: '#fff', color: '#203b30' }}>معلومات الطالب والرصيد الحالي</Box>
    </Box>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth><DialogTitle>إضافة متابعة جديدة</DialogTitle><DialogContent>
      <Box id="legacy" sx={{ p: 2, bgcolor: '#f5f8f6', color: '#203b30' }}>معلومات الطالب</Box>
      <TextField label="المتابعة" fullWidth sx={{ my: 2 }} />
      <TextField select defaultValue="new" fullWidth label="الحالة"><MenuItem value="new">جديد</MenuItem><MenuItem value="done">مكتمل</MenuItem></TextField>
      <Button id="nested" onClick={() => setNested(true)}>تأكيد</Button><Button id="close" onClick={() => setOpen(false)}>إغلاق</Button>
    </DialogContent></Dialog>
    <Dialog open={nested} onClose={() => setNested(false)}><DialogTitle>تأكيد الحفظ</DialogTitle><Button id="close-nested" onClick={() => setNested(false)}>رجوع</Button></Dialog>
  </>;
}
createRoot(document.getElementById('root')).render(<CacheProvider value={createAppCache()}><ColorModeProvider><Fixture /></ColorModeProvider></CacheProvider>);
