import * as uiLayout from './common/uiLayout';
import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Table, TableHead, TableRow, TableCell,
  TableBody, CircularProgress, Typography, Paper, TableContainer,
  TextField, MenuItem, Button, Box, TablePagination, Chip,
  Card, CardContent, Grid, IconButton, Collapse, Alert
} from '@mui/material';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExpandMore, ExpandLess, FilterList, Download } from '@mui/icons-material';

export default function MyCallHistoryDialog({ open, onClose, userGuid }) {
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [users, setUsers] = useState([]); // ✅ تخزين بيانات المستخدمين
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [expandedCall, setExpandedCall] = useState(null);

  // ✅ الفلاتر
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [forwardFilter, setForwardFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ✅ Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (open && userGuid) {
      fetchUsers();
      fetchCalls();
    }
  }, [open, userGuid]);

  useEffect(() => {
    applyFilters();
  }, [calls, statusFilter, typeFilter, forwardFilter, nameFilter, startDate, endDate]);

  // ✅ جلب بيانات المستخدمين
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await axios.get('https://api1.sstli.com/api/userinfo');
      setUsers(response.data);
    } catch (error) {
      console.error("فشل تحميل بيانات المستخدمين:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  // ✅ جلب المكالمات
  const fetchCalls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`https://api1.sstli.com/api/calls/user/${userGuid}`);
      // ترتيب المكالمات من الأحدث للأقدم
      const sortedCalls = response.data.sort((a, b) => new Date(b.callDate) - new Date(a.callDate));
      setCalls(sortedCalls);
    } catch (error) {
      console.error("فشل تحميل الاتصالات:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ دالة للحصول على اسم المستخدم من الـ GUID
  const getUserName = (userGuid) => {
    if (!userGuid) return 'غير معروف';
    
    const user = users.find(u => u.guid === userGuid);
    return user ? user.fullName : 'غير معروف';
  };

  const applyFilters = () => {
    let filtered = [...calls];

    if (nameFilter) {
      filtered = filtered.filter(call =>
        call.studentName?.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(call => call.type === typeFilter);
    }

    if (forwardFilter) {
      if (forwardFilter === 'not_forwarded') {
        filtered = filtered.filter(call => !call.forwardCall);
      } else if (forwardFilter === 'sales') {
        filtered = filtered.filter(call => call.forwardTo === 'sales');
      } else if (forwardFilter === 'supervisor') {
        filtered = filtered.filter(call => call.forwardTo === 'supervisor');
      }
    }

    if (startDate && endDate) {
      filtered = filtered.filter(call => {
        const callDate = call.callDate?.split('T')[0];
        return callDate >= startDate && callDate <= endDate;
      });
    }

    setFilteredCalls(filtered);
    setPage(0);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setForwardFilter('');
    setNameFilter('');
    setStartDate('');
    setEndDate('');
    setFilteredCalls(calls);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleExpandCall = (callId) => {
    setExpandedCall(expandedCall === callId ? null : callId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'مكتملة': return 'success';
      case 'متابعة لاحقا': return 'warning';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'شكوي': return 'error';
      case 'أستفسار دراسي': return 'info';
      case 'أستفسار عام': return 'primary';
      default: return 'default';
    }
  };

  const getForwardInfo = (call) => {
    if (!call.forwardCall) {
      return { text: 'غير ممررة', color: 'default' };
    }
    
    let forwardText = 'ممررة';
    let forwardColor = 'info';
    
    switch (call.forwardTo) {
      case 'sales':
        forwardText = 'ممررة للمبيعات';
        forwardColor = 'secondary';
        break;
      case 'supervisor':
        // ✅ استخدام اسم المشرف الحقيقي بدل GUID
        const supervisorName = getUserName(call.supervisorGuid);
        forwardText = `ممررة للمشرف: ${supervisorName}`;
        forwardColor = 'warning';
        break;
      default:
        forwardText = 'ممررة';
        forwardColor = 'info';
    }
    
    return { text: forwardText, color: forwardColor };
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait' });
    doc.setFontSize(16);
    doc.text('سجل الاتصالات - التقرير التفصيلي', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`, 15, 25);
    doc.text(`إجمالي المكالمات: ${filteredCalls.length}`, 15, 32);

    const tableHead = [[
      'رقم الاتصال',
      'الطالب',
      'نوع الاتصال', 
      'التاريخ',
      'الحالة',
      'التوجيه',
      'ملاحظات'
    ]];

    const tableBody = filteredCalls.map(call => [
      call.code,
      call.studentName || '-',
      call.type,
      call.callDate?.split('T')[0],
      call.status,
      getForwardInfo(call).text,
      call.notes || '-'
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 40,
      styles: { fontSize: 8, halign: 'right' },
      headStyles: { fillColor: [25, 118, 210] }
    });

    doc.save('سجل_الاتصالات_المفصل.pdf');
  };

  const paginatedCalls = filteredCalls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Dialog sx={uiLayout.dialogLayoutSx} open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ 
        backgroundColor: '#1976d2', 
        color: 'white',
        textAlign: 'center', 
        fontFamily: 'cairo',
        fontWeight: 'bold',
        fontSize: '1.5rem',
        py: 2
      }}>
         سجل اتصالاتي - التفصيلي
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* ✅ بطالة الإحصائيات */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e3f2fd', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {calls.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إجمالي المكالمات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fff3e0', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {calls.filter(call => call.type === 'شكوي').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  مكالمات شكوى
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#e8f5e8', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {calls.filter(call => call.status === 'مكتملة').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  مكالمات مكتملة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#fce4ec', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h6" color="secondary.main">
                  {calls.filter(call => call.forwardCall).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  مكالمات ممررة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ✅ فلترة متقدمة */}
        <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <CardContent>
            <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
              <FilterList sx={{ marginInlineEnd: 1 }} />
              <Typography variant="h6">فلترة متقدمة</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  label="🔍 بحث باسم الطالب"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  select
                  label="نوع المكالمة"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">الكل</MenuItem>
                  <MenuItem value="شكوي">شكوي</MenuItem>
                  <MenuItem value="أستفسار دراسي">أستفسار دراسي</MenuItem>
                  <MenuItem value="أستفسار عام">أستفسار عام</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  select
                  label="حالة المكالمة"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">الكل</MenuItem>
                  <MenuItem value="مكتملة">مكتملة</MenuItem>
                  <MenuItem value="متابعة لاحقا">متابعة لاحقاً</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                  fullWidth
                  select
                  label="حالة التوجيه"
                  value={forwardFilter}
                  onChange={(e) => setForwardFilter(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">الكل</MenuItem>
                  <MenuItem value="not_forwarded">غير ممررة</MenuItem>
                  <MenuItem value="sales">ممررة للمبيعات</MenuItem>
                  <MenuItem value="supervisor">ممررة للمشرف</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={uiLayout.formGridSx} display="flex" gap={1}>
                  <TextField sx={uiLayout.formFieldSx}
                    fullWidth
                    label="من تاريخ"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <TextField sx={uiLayout.formFieldSx}
                    fullWidth
                    label="إلى تاريخ"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </Box>
              </Grid>
            </Grid>

            <Box display="flex" gap={1} sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.actionBarSx)}>
              <Button sx={uiLayout.buttonSx} 
                variant="contained" 
                onClick={applyFilters}
                startIcon={<FilterList />}
              >
                تطبيق الفلترة
              </Button>
              <Button sx={uiLayout.buttonSx} 
                variant="outlined" 
                color="error" 
                onClick={clearFilters}
              >
                مسح الكل
              </Button>
              <Button 
                variant="contained" 
                color="success" 
                onClick={downloadPDF}
                startIcon={<Download />}
                sx={uiLayout.withUiSx({ mr: 'auto' }, uiLayout.buttonSx)}
              >
                تصدير PDF
              </Button>
            </Box>
          </CardContent>
        </Card>

        {(loading || usersLoading) ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
            <Typography sx={{ mr: 2 }}>جاري تحميل البيانات...</Typography>
          </Box>
        ) : filteredCalls.length === 0 ? (
          <Alert severity="info" sx={{ textAlign: 'center', fontFamily: 'cairo' }}>
            لا توجد نتائج تطابق معايير البحث
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={uiLayout.withUiSx({ border: '1px solid #e0e0e0' }, uiLayout.tableContainerSx)}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell align="center" sx={{ minWidth: 80 }}>التفاصيل</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>الطالب</TableCell>
                  <TableCell align="center" sx={{ minWidth: 110 }}>رقم الجوال</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>رقم الهوية</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>نوع الاتصال</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>التاريخ</TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>الوقت</TableCell>
                  <TableCell align="center" sx={{ minWidth: 150 }}>حالة التوجيه</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>الحالة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCalls.map((call, index) => (
                  <React.Fragment key={call.guid || index}>
                    <TableRow sx={{ 
                      backgroundColor: expandedCall === call.guid ? '#f8f9fa' : 'inherit',
                      '&:hover': { backgroundColor: '#f5f5f5' }
                    }}>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => toggleExpandCall(call.guid)}
                          color="primary"
                        >
                          {expandedCall === call.guid ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight="medium">
                          {call.studentName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center"><bdi dir="ltr">{call.studentTel || '-'}</bdi></TableCell>
                      <TableCell align="center"><bdi dir="ltr">{call.nationalId || '-'}</bdi></TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={call.type} 
                          size="small" 
                          color={getTypeColor(call.type)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {call.callDate?.split('T')[0]}
                      </TableCell>
                      <TableCell align="center">
                        {call.callTime ? new Date(call.callTime).toLocaleTimeString('ar-EG') : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={getForwardInfo(call).text} 
                          size="small" 
                          color={getForwardInfo(call).color}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={call.status} 
                          size="small" 
                          color={getStatusColor(call.status)}
                        />
                      </TableCell>
                    </TableRow>
                    
                    {/* ✅ صف التفاصيل الممتدة */}
                    <TableRow>
                      <TableCell colSpan={9} sx={{ p: 0, border: 'none' }}>
                        <Collapse in={expandedCall === call.guid} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 3, backgroundColor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom color="primary" fontWeight="bold">
                                  📝 ملاحظات المكالمة:
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, minHeight: 80 }}>
                                  <Typography variant="body2">
                                    {call.notes || 'لا توجد ملاحظات'}
                                  </Typography>
                                </Paper>
                              </Grid>
                              
                              {call.type === 'شكوي' && call.complainDetails && (
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle1" gutterBottom color="error" fontWeight="bold">
                                    🗣️ تفاصيل الشكوى:
                                  </Typography>
                                  <Paper variant="outlined" sx={{ p: 2, minHeight: 80, borderColor: 'error.light' }}>
                                    <Typography variant="body2" color="error.dark">
                                      {call.complainDetails}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              )}
                              
                              <Grid item xs={12}>
                                <Box display="flex" gap={2} flexWrap="wrap">
                                  <Chip 
                                    label={`رقم الاتصال: ${call.code}`} 
                                    variant="outlined" 
                                    size="small" 
                                  />
                                  <Chip 
                                    label={`المستخدم: ${call.userFullName}`} 
                                    variant="outlined" 
                                    size="small" 
                                  />
                                  {call.supervisorGuid && (
                                    <Chip 
                                      label={`مشرف: ${getUserName(call.supervisorGuid)}`} 
                                      variant="outlined" 
                                      size="small"
                                      color="warning"
                                    />
                                  )}
                                  {call.forwardTo === 'sales' && call.supervisorGuid && (
                                    <Chip 
                                      label={`موظف مبيعات: ${getUserName(call.supervisorGuid)}`} 
                                      variant="outlined" 
                                      size="small"
                                      color="secondary"
                                    />
                                  )}
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>

            {/* ✅ Pagination */}
            <TablePagination sx={uiLayout.tablePaginationSx}
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredCalls.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="عدد الصفوف:"
              labelDisplayedRows={({ from, to, count }) => 
                `عرض ${from}-${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
              }
            />
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}