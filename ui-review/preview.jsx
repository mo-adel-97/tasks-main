// Local visual fixture only; this entry is never imported by the application.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, CssBaseline, Box, Paper, Typography, TextField, Button, Checkbox, FormControlLabel,
  Autocomplete, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import theme, { createAppCache } from '../src/theme';
import * as ui from '../src/components/common/uiLayout';
import SalesManManagement from '../src/pages/SalesManManagement';
import UserManagement from '../src/pages/UserManagement';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/contexts/AuthContext';
import '../src/index.css';

// No real credentials, APIs or writes: only deterministic fixture responses.
localStorage.setItem('user', JSON.stringify({ guid: 'visual-fixture', fullName: 'مستخدم تجريبي' }));
window.fetch = async url => {
  let data = { data: {} };
  if(String(url).includes('screen-access')) data = { allowed: true };
  if(String(url).includes('user-permissions')) data = { data: { file: { canView: true, screens: { addSalesMan: true } } } };
  if(String(url).includes('bootstrap')) data = { data: { permissions: { canView: true, canAdd: true, canEdit: true, canFind: true },
    branches: [{ guid: 'fixture-branch', name: 'فرع تجريبي — اسم طويل لاختبار العرض', code: '101' }] } };
  if(String(url).includes('/users?') || String(url).includes('/salesmen?')) data = { data: [{ guid: 'fixture-row',code:'101',name:'اسم تجريبي طويل لاختبار البحث',status:'نشط' }] };
  return { ok: true, status: 200, json: async()=>data, text: async()=>JSON.stringify(data) };
};
function Fixtures() {
  const [open,setOpen]=useState(false);
  const [value,setValue]=useState('');
  const [active,setActive]=useState(true);
  const field=(label,type='text')=><TextField label={label} type={type} value={type==='text'?value:undefined}
    onChange={e=>setValue(e.target.value)} sx={ui.formFieldSx} InputLabelProps={{shrink:true}} />;
  return <Box sx={{p:{xs:2,sm:3},maxWidth:1400,mx:'auto'}}>
    <Paper sx={{p:3,mb:3}}>
      <Typography variant="h5" sx={{mb:3,fontWeight:800}}>إدارة البيانات — نموذج عربي</Typography>
      <Box sx={ui.formGridSx}>
        {field('اسم المندوب')}{field('الاسم المختصر')}{field('تاريخ التسجيل','date')}
        <FormControlLabel sx={ui.checkboxFieldSx} control={<Checkbox checked={active} onChange={e=>setActive(e.target.checked)} />} label="نشط" />
        <TextField label="البريد الإلكتروني" defaultValue="example@example.test" type="email" sx={ui.formFieldSx} InputLabelProps={{shrink:true}}
          InputProps={{startAdornment:<InputAdornment position="start">@</InputAdornment>}} />
        <TextField label="حالة الاتصال" select defaultValue="new" sx={ui.formFieldSx} InputLabelProps={{shrink:true}}><MenuItem value="new">جديد</MenuItem><MenuItem value="done">تم التواصل</MenuItem></TextField>
        <Autocomplete options={['الرياض','جدة','الدمام']} renderInput={params=><TextField {...params} label="الفرع" sx={ui.formFieldSx} InputLabelProps={{...params.InputLabelProps,shrink:true}} />} />
        <TextField label="حقل مطلوب" error helperText="يرجى إكمال هذا الحقل" sx={ui.formFieldSx} InputLabelProps={{shrink:true}} />
      </Box>
      <Box sx={{...ui.actionBarSx,mt:3}}><Button variant="contained" onClick={()=>setOpen(true)}>عرض الحوار</Button><Button variant="outlined">إلغاء</Button></Box>
    </Paper>
    <Paper sx={{p:3}}>
      <Typography variant="h6" sx={{mb:2}}>تقرير المتابعة</Typography>
      <Box sx={{...ui.filterBarSx,mb:3}}>{field('من تاريخ','date')}{field('إلى تاريخ','date')}{field('بحث شامل')}
        <Button variant="contained">عرض</Button><Button variant="outlined">تحديث</Button><Button variant="outlined">تصدير Excel</Button><Button color="error">مسح الفلاتر</Button></Box>
      <Box sx={{height:320,...ui.tableContainerSx}}><DataGrid sx={ui.dataGridSx} rows={[{id:1,name:'طالب تجريبي',branch:'فرع الرياض',code:'TEST-101'}]}
        columns={[{field:'name',headerName:'اسم الطالب',minWidth:220,flex:1},{field:'branch',headerName:'الفرع',minWidth:200,flex:1},{field:'code',headerName:'الكود',minWidth:180}]} /></Box>
    </Paper>
    <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="sm" dir="rtl" sx={ui.dialogLayoutSx}>
      <DialogTitle>بيانات الموظف</DialogTitle><DialogContent dividers><Box sx={ui.formGridSx}>{field('اسم الموظف')}{field('رقم الجوال','tel')}</Box></DialogContent>
      <DialogActions sx={ui.dialogActionsSx}><Button variant="contained" onClick={()=>setOpen(false)}>حفظ</Button><Button onClick={()=>setOpen(false)}>إلغاء</Button></DialogActions>
    </Dialog>
  </Box>;
}
const page = new URLSearchParams(location.search).get('page') || 'fixtures';
const views = { fixtures: <Fixtures/>, sales: <SalesManManagement/>, users: <UserManagement/>, login: <AuthProvider><Login/></AuthProvider> };
createRoot(document.getElementById('root')).render(<MemoryRouter><CacheProvider value={createAppCache()}><ThemeProvider theme={theme}><CssBaseline/>{views[page] || views.fixtures}</ThemeProvider></CacheProvider></MemoryRouter>);
