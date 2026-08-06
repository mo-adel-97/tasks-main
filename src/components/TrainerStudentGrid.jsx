import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, MenuItem, Select, FormControl,
  InputLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Card, CardContent, Chip, IconButton, List, ListItem, ListItemText, Divider,
  Tabs, Tab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HistoryIcon from '@mui/icons-material/History';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FolderIcon from '@mui/icons-material/Folder';
import SchoolIcon from '@mui/icons-material/School';
import axios from 'axios';
import Sidebar from './Sidebar';
import SpecialComponent from './SpecialComponent'; // تأكد من تعديل المسار حسب حاجتك

const API_BASE = 'https://api1.sstli.com';
const PHP_BASE = 'https://filesregsiteration.sstli.com';

// تعريف اللون الأساسي
const PRIMARY_COLOR = '#80b49e';
const PRIMARY_COLOR_DARK = '#6a9a87';
const PRIMARY_COLOR_LIGHT = '#9ac8b5';

const TrainerStudentGrid2 = () => {
  const [rows, setRows] = useState([]);
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs());
  const [rowStatuses, setRowStatuses] = useState({});
  const [rowNotes, setRowNotes] = useState({});
  const [studentHistory, setStudentHistory] = useState({});
  const [trainers, setTrainers] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [showSpecial, setShowSpecial] = useState(false);

  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentActionRow, setCurrentActionRow] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  // ✅ حالات/داتا كشف الحساب
  const [statements, setStatements] = useState([]);
  const [statementsLoading, setStatementsLoading] = useState(false);

  // ✅ حالات/داتا ملف التدريب
  const [trainingFile, setTrainingFile] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  // معلومات الدراسة
  const [studyInfo, setStudyInfo] = useState([]);
  const [studyLoading, setStudyLoading] = useState(false);

  // ✅ كاش للاكونت جيو آي دي لكل nationalId
  const [accountGuidCache, setAccountGuidCache] = useState({});

  const user = JSON.parse(localStorage.getItem('user'));
  const branchGuid = user?.branchForWork;
  const trainerGuid = user?.trainerGuid;

  // ✅ إضافة هذا الـ useEffect للتحقق من الصلاحيات
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    console.log('userJop:', user?.userJop, typeof user?.userJop); // Debug
    if ([0, 1, 2, 3, 9].includes(Number(user?.userJop))) setShowSpecial(true);
  }, []);

  // Helper: استنتاج accountGuid من الصف (لو متوفر مباشرة)
  const resolveAccountGuidLocal = (row) => {
    return (
      row?.accountGuid ||
      row?.studentAccountGuid ||
      row?.accountId ||
      row?.AccountGuid ||
      row?.AccountID ||
      null
    );
  };

  // ✅ API Calls (ثابتة)
  const api = {
    trainers: `${API_BASE}/api/userinfo`,
    studentByNational: (nationalId) => `${API_BASE}/api/student/${nationalId}`,
    statementsByAccount: (guid) => `${API_BASE}/api/studentstatement/${guid}`,
    trainingFileByAccount: (guid) => `${API_BASE}/api/trainingfile/${guid}`,
    studyInfoByAccount: (guid) => `${API_BASE}/api/studyinfo/${guid}`,
    studentList: (branch, trainer, fromD, toD) =>
      `${API_BASE.replace('5275', '5122')}/api/Trainer/StudentList?branchGuid=${branch}&trainerGuid=${trainer}&fromDate=${fromD}&toDate=${toD}`,
    statuses: (branch, trainer) =>
      `${PHP_BASE}/getStatusesAndNotes.php?branchGuid=${branch}&trainerGuid=${trainer}`,
    updateStatusNote: `${PHP_BASE}/updateStatusAndNote.php`,
    studentHistory: (nationalId) =>
      `${PHP_BASE}/getStudentHistory.php?nationalId=${nationalId}`,
  };

  // Fetch trainers data
  const fetchTrainers = async () => {
    try {
      const response = await fetch(api.trainers);
      const trainersData = await response.json();
      const trainersMap = {};
      trainersData.forEach((trainer) => {
        if (trainer.trainerGuid) {
          trainersMap[trainer.trainerGuid] = trainer.fullName;
        }
      });
      setTrainers(trainersMap);
    } catch (error) {
      console.error('❌ Failed to fetch trainers:', error);
    }
  };

  // Fetch student history (PHP)
  const fetchStudentHistory = async (nationalId) => {
    try {
      const response = await fetch(api.studentHistory(nationalId));
      const history = await response.json();
      return history || [];
    } catch (error) {
      console.error('Error fetching student history:', error);
      return [];
    }
  };

  // Fetch student data + statuses/notes
  const fetchData = async () => {
    const url = api.studentList(
      branchGuid,
      trainerGuid,
      fromDate.format('YYYY-MM-DD'),
      toDate.format('YYYY-MM-DD')
    );
    const statusUrl = api.statuses(branchGuid, trainerGuid);

    try {
      // 1) الطلاب
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(
          `❌ Failed to fetch student list\nStatus: ${res.status} ${res.statusText}\nResponse Body: ${errorText}`
        );
      }

      let data = await res.json();

      const rowsWithId = data.map((item) => ({
        ...item,
        id: item.nationalId,
        balance: Number(item.balance),
        commission: Number(item.commission || 0),
        prebalance: Number(item.prebalance || 0),
        madeN__: Number(item.madeN__ || 0),
        startpay: Number(item.startpay || 0),
        monthpay: Number(item.monthpay || 0),
        fesspay: Number(item.fesspay || 0),
        mDaily_: Number(item.mDaily_ || 0),
        dDaily_: Number(item.dDaily_ || 0),
      }));

      // 2) الحالات والملاحظات
      const statusRes = await fetch(statusUrl);
      if (!statusRes.ok) {
        const errorText = await statusRes.text();
        throw new Error(
          `❌ Failed to fetch statuses\nStatus: ${statusRes.status} ${statusRes.statusText}\nResponse Body: ${errorText}`
        );
      }
      const statusesData = await statusRes.json();

      // 3) معالجة
      const updatedStatuses = {};
      const updatedNotes = {};
      const updatedHistory = {};

      rowsWithId.forEach((row) => {
        const history = statusesData[row.id];
        updatedHistory[row.id] = history || [];

        if (Array.isArray(history) && history.length > 0) {
          const filtered = history.filter((entry) => {
            const entryDate = dayjs(entry.dateRecorded).startOf('day');
            return (
              entryDate.isSame(fromDate, 'day') ||
              entryDate.isSame(toDate, 'day') ||
              (entryDate.isAfter(fromDate) && entryDate.isBefore(toDate))
            );
          });

          if (filtered.length > 0) {
            const latest = filtered[filtered.length - 1];
            updatedStatuses[row.id] = row.monthpay > 0 ? 'paid' : latest.status;
            updatedNotes[row.id] = latest.note;
          } else {
            updatedStatuses[row.id] = row.monthpay > 0 ? 'paid' : '';
            updatedNotes[row.id] = '';
          }
        } else {
          updatedStatuses[row.id] = row.monthpay > 0 ? 'paid' : '';
          updatedNotes[row.id] = '';
        }
      });

      setRows(rowsWithId);
      setRowStatuses(updatedStatuses);
      setRowNotes(updatedNotes);
      setStudentHistory(updatedHistory);
    } catch (err) {
      console.error('💥 An error occurred in fetchData:', err);
    }
  };

  const updateStatusAndNoteOnServer = async (id, status, note = '') => {
    const body = {
      studentId: id,
      status,
      note,
      branchGuid,
      trainerGuid,
    };

    try {
      await fetch(api.updateStatusNote, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // Refresh data after update
      fetchData();
    } catch (error) {
      console.error('Failed to update status/note:', error);
    }
  };

  const handleStatusChange = async (id, status) => {
    const row = rows.find((r) => r.id === id);
    if (row && row.monthpay > 0 && status !== 'paid') return;

    const updated = { ...rowStatuses, [id]: status };
    setRowStatuses(updated);
    await updateStatusAndNoteOnServer(id, status, rowNotes[id] || '');
  };

  const handleNoteSave = async () => {
    if (!noteInput.trim()) return;

    const updatedNotes = { ...rowNotes, [currentActionRow.id]: noteInput };
    setRowNotes(updatedNotes);
    await updateStatusAndNoteOnServer(
      currentActionRow.id,
      rowStatuses[currentActionRow.id] || 'note',
      noteInput
    );
    setNoteInput('');
  };

  // =============== ✅ الجزء المهم: جلب accountGuid ثم كشف الحساب والملف التدريبي ===============

  // يحسم الـ accountGuid: من الصف لو موجود، وإلا يجيبه من /api/student/{nationalId} ويكاشّه
  const getOrFetchAccountGuid = async (row) => {
    // 1) لو موجود محليًا في الصف
    const local = resolveAccountGuidLocal(row);
    if (local) return local;

    const nationalId =
      row?.nationalId ||
      row?.id ||
      row?.NationalId ||
      row?.NID ||
      null;

    if (!nationalId) {
      console.warn('⚠️ لا يوجد nationalId في الصف لاستخراج accountGuid');
      return null;
    }

    // 2) كاش؟
    if (accountGuidCache[nationalId]) {
      return accountGuidCache[nationalId];
    }

    // 3) نجيب الطالب ونكاشّي
    try {
      const resp = await axios.get(api.studentByNational(nationalId));
      const guid = resp?.data?.accountGuid || null;
      if (guid) {
        setAccountGuidCache((prev) => ({ ...prev, [nationalId]: guid }));
      }
      return guid;
    } catch (e) {
      console.error('❌ فشل في جلب student للحصول على accountGuid:', e);
      return null;
    }
  };

  // ✅ كشف الحساب
  const fetchStatements = async (accountGuid) => {
    if (!accountGuid) {
      setStatements([]);
      return;
    }
    setStatementsLoading(true);
    try {
      const response = await axios.get(api.statementsByAccount(accountGuid));
      setStatements(response.data || []);
    } catch (error) {
      console.error('Error fetching statement', error);
      setStatements([]);
    } finally {
      setStatementsLoading(false);
    }
  };

  // ✅ الملف التدريبي
const fetchTrainingFile = async (accountGuid) => {
  if (!accountGuid) {
    setTrainingFile([]);
    return;
  }
  setTrainingLoading(true);
  try {
    const resp = await axios.get(`https://api1.sstli.com/api/studyinfo/${accountGuid}`);
    setTrainingFile(resp?.data || []);
  } catch (error) {
    console.error('Error fetching training file', error);
    setTrainingFile([]);
  } finally {
    setTrainingLoading(false);
  }
};

  // معلومات الدراسة
  const fetchStudyInfo = async (accountGuid) => {
    if (!accountGuid) {
      setStudyInfo([]);
      return;
    }
    setStudyLoading(true);
    try {
      const resp = await axios.get(api.studyInfoByAccount(accountGuid));
      setStudyInfo(resp?.data || []);
    } catch (error) {
      console.error('Error fetching study info', error);
      setStudyInfo([]);
    } finally {
      setStudyLoading(false);
    }
  };

  // فتح الديلوج + جلب البيانات
  const handleOpenActionDialog = async (row) => {
    setCurrentActionRow(row);
    setNoteInput(rowNotes[row.id] || '');
    setCurrentTab(0); // العودة للتبويب الأول

    // سجل المتابعات من PHP
    const completeHistory = await fetchStudentHistory(row.id);
    setStudentHistory((prev) => ({
      ...prev,
      [row.id]: completeHistory,
    }));

    // جلب accountGuid والبيانات المرتبطة
    const accountGuid = await getOrFetchAccountGuid(row);

    await Promise.allSettled([
      fetchStatements(accountGuid),
      fetchTrainingFile(accountGuid),
      fetchStudyInfo(accountGuid),
    ]);

    setActionDialogOpen(true);
  };

  const handleWhatsAppClick = (phoneNumber) => {
    const rawNumber = phoneNumber?.toString().replace(/^0/, '');
    const whatsappNumber = `966${rawNumber}`;
    const waUrl = `https://wa.me/${whatsappNumber}`;
    window.open(waUrl, '_blank');
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'paid':
        return 'تم السداد';
      case 'note':
        return 'متابعة';
      case 'late':
        return 'متأخر';
      default:
        return 'بدون';
    }
  };

  const getTrainerName = (trainerGuid) => {
    return trainers[trainerGuid] || 'غير معروف';
  };

  useEffect(() => {
    fetchTrainers();
    fetchData();
    // eslint-disable-next-line
  }, [fromDate, toDate]);

// في قسم filteredRows، أضف شرط تصفية الرصيد
const filteredRows = rows.filter((row) => {
  const status = rowStatuses[row.id] || '';
  
  // تجاهل الطلاب الذين رصيدهم 0
  
  if (!filterStatus) return true;
  if (filterStatus === 'none') return status === '';
  return status === filterStatus;
});

  // Statistics
  const totalStudents = filteredRows.length;
  const paidStudents = filteredRows.filter((row) => rowStatuses[row.id] === 'paid').length;
  const notedStudents = filteredRows.filter((row) => rowStatuses[row.id] === 'note').length;
  const lateStudents = filteredRows.filter((row) => rowStatuses[row.id] === 'late').length;

  const totalCommission = filteredRows.reduce((sum, row) => sum + (row.commission || 0), 0);

  const columns = [
    {
      field: 'studentName',
      headerName: 'اسم الطالب',
      flex: 1.5,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon sx={{ color: PRIMARY_COLOR }} fontSize="small" />
          <Typography variant="body2" fontWeight="500">
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'nationalId',
      headerName: 'رقم الهوية',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'studentTel',
      headerName: 'الجوال',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'balance',
      headerName: 'الرصيد الحالي',
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <PaymentIcon fontSize="small" color={params.value > 0 ? 'error' : 'success'} />
          <Typography variant="body2" fontWeight="600" color={params.value > 0 ? 'error' : 'success'}>
            {Number(params.value || 0).toLocaleString('ar-EG')} ر.س
          </Typography>
        </Box>
      ),
    },
    {
      field: 'commission',
      headerName: 'العمولة',
      flex: 1,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <AttachMoneyIcon fontSize="small" sx={{ color: PRIMARY_COLOR }} />
          <Typography variant="body2" fontWeight="600" sx={{ color: PRIMARY_COLOR }}>
            {Number(params.value || 0).toLocaleString('ar-EG')} ر.س
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 120,
      renderCell: (params) => {
        const isPaid = params.row.monthpay > 0;
        const status = isPaid ? 'paid' : (rowStatuses[params.id] || '');
        const note = rowNotes[params.id] || '';

        const getStatusChip = () => {
          if (status === 'paid') {
            return <Chip label="مسدد" sx={{ backgroundColor: '#4caf50', color: 'white' }} size="small" />;
          } else if (status === 'note') {
            return (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Chip label="متابعة" sx={{ backgroundColor: '#ff9800', color: 'white' }} size="small" />
                {note && (
                  <Tooltip title={note} arrow>
                    <InfoIcon sx={{ color: '#ff9800' }} fontSize="small" sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                )}
              </Box>
            );
          } else if (status === 'late') {
            return <Chip label="متأخر" sx={{ backgroundColor: '#f44336', color: 'white' }} size="small" />;
          }
          return <Chip label="بدون" variant="outlined" size="small" />;
        };

        return getStatusChip();
      },
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleOpenActionDialog(params.row)}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 2,
            '&:hover': {
              backgroundColor: PRIMARY_COLOR_LIGHT,
              borderColor: PRIMARY_COLOR,
            }
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  // تابع لتغيير التبويبات
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // تعريف التبويبات
  const tabs = [
    { label: 'المعلومات الرئيسية', icon: <PersonIcon /> },
    { label: ' الفواتير', icon: <ReceiptIcon /> },
    { label: 'الملف التدريبي', icon: <FolderIcon /> },
    { label: 'سجل المتابعات', icon: <HistoryIcon /> },
  ];

  // ✅ إضافة هذا قبل الـ return الرئيسي
  if (showSpecial) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Sidebar />
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            marginLeft: '280px',
            width: 'calc(100% - 280px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <SpecialComponent onBack={() => setShowSpecial(false)} />
        </Box>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            marginLeft: '280px', // مساحة للسايدبار
            width: 'calc(100% - 280px)',
            transition: 'all 0.3s ease'
          }}
        >
          {/* Header Section */}
          <Card sx={{ mb: 3, boxShadow: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography 
                variant="h5" 
                fontWeight="bold" 
                gutterBottom
                sx={{ color: PRIMARY_COLOR }}
              >
                قائمة الطلاب
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                إدارة ومتابعة طلاب المدرب
              </Typography>

              {/* Statistics Cards */}
              <Box display="flex" gap={2} flexWrap="wrap" sx={{ mb: 3 }}>
                <Card sx={{ flex: 1, minWidth: 150, bgcolor: PRIMARY_COLOR, color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" fontWeight="bold">{totalStudents}</Typography>
                    <Typography variant="body2">إجمالي الطلاب</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, minWidth: 150, bgcolor: '#4caf50', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" fontWeight="bold">{paidStudents}</Typography>
                    <Typography variant="body2">مسددين</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, minWidth: 150, bgcolor: '#ff9800', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" fontWeight="bold">{notedStudents}</Typography>
                    <Typography variant="body2">متابعة</Typography>
                  </CardContent>
                </Card>
                <Card sx={{ flex: 1, minWidth: 150, bgcolor: '#f44336', color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" fontWeight="bold">{lateStudents}</Typography>
                    <Typography variant="body2">متأخرين</Typography>
                  </CardContent>
                </Card>
                {/* Total Commission Card */}
                <Card sx={{ flex: 1, minWidth: 150, bgcolor: PRIMARY_COLOR_DARK, color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h4" fontWeight="bold">
                      {totalCommission.toLocaleString('ar-EG')}
                    </Typography>
                    <Typography variant="body2">إجمالي العمولة</Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Filters Section */}
              <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                <DatePicker
                  label="من تاريخ"
                  value={fromDate}
                  onChange={setFromDate}
                  sx={{ minWidth: 150 }}
                />
                <DatePicker
                  label="إلى تاريخ"
                  value={toDate}
                  onChange={setToDate}
                  sx={{ minWidth: 150 }}
                />
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel id="filter-status-label">فلترة حسب الحالة</InputLabel>
                  <Select
                    labelId="filter-status-label"
                    value={filterStatus}
                    label="فلترة حسب الحالة"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="">الكل</MenuItem>
                    <MenuItem value="paid">تم السداد</MenuItem>
                    <MenuItem value="note">متابعة</MenuItem>
                    <MenuItem value="late">متأخر</MenuItem>
                    <MenuItem value="none">بدون</MenuItem>
                  </Select>
                </FormControl>
                <Button 
                  variant="contained" 
                  onClick={fetchData} 
                  sx={{ 
                    px: 3,
                    backgroundColor: PRIMARY_COLOR,
                    '&:hover': {
                      backgroundColor: PRIMARY_COLOR_DARK,
                    }
                  }}
                >
                  تحديث البيانات
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Data Grid Section */}
          <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  disableRowSelectionOnClick
                  getRowClassName={(params) => {
                    const status = rowStatuses[params.id];
                    if (params.row.monthpay > 0) return 'status-paid';
                    if (status === 'paid') return 'status-paid';
                    if (status === 'note') return 'status-note';
                    if (status === 'late') return 'status-late';
                    return '';
                  }}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell': {
                      borderBottom: '1px solid #e0e0e0',
                      fontWeight: 500,
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: PRIMARY_COLOR_LIGHT,
                      borderBottom: `2px solid ${PRIMARY_COLOR}`,
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 700,
                      color: '#1e293b',
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      backgroundColor: 'white',
                    },
                    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                      outline: 'none',
                    },
                    '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                      outline: 'none',
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Dialog */}
          <Dialog
            open={actionDialogOpen}
            onClose={() => setActionDialogOpen(false)}
            maxWidth="lg"
            fullWidth
            sx={{ 
              '& .MuiDialog-paper': { 
                borderRadius: 3,
              } 
            }}
          >
            <DialogTitle
              sx={{
                bgcolor: PRIMARY_COLOR,
                color: 'white',
                py: 3,
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="center" gap={2}>
                <PersonIcon fontSize="large" />
                إجراءات الطالب - {currentActionRow?.studentName}
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              {/* التبويبات */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={currentTab} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      py: 2,
                      color: PRIMARY_COLOR,
                    },
                    '& .Mui-selected': {
                      color: PRIMARY_COLOR,
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: PRIMARY_COLOR,
                    }
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab 
                      key={index}
                      icon={tab.icon} 
                      iconPosition="start"
                      label={tab.label} 
                    />
                  ))}
                </Tabs>
              </Box>

              {/* محتوى التبويبات */}
              <Box sx={{ p: 3 }}>
                {/* التبويب 1: المعلومات الرئيسية */}
                {currentTab === 0 && (
                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={4}>
                    {/* Left Column - Student Info and Actions */}
                    <Box display="flex" flexDirection="column" gap={3}>
                      {/* Student Info Card */}
                      <Card
                        sx={{
                          boxShadow: 3,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color: PRIMARY_COLOR,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 3,
                              fontWeight: 'bold',
                            }}
                          >
                            <PersonIcon /> معلومات الطالب
                          </Typography>

                          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
                            <Box
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <PaymentIcon sx={{ color: PRIMARY_COLOR, fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                الرصيد الحالي
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                {Number(currentActionRow?.balance || 0).toLocaleString('ar-EG')} ر.س
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <AttachMoneyIcon sx={{ color: PRIMARY_COLOR, fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                العمولة
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" sx={{ color: PRIMARY_COLOR }}>
                                {Number(currentActionRow?.commission || 0).toLocaleString('ar-EG')} ر.س
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <PaymentIcon sx={{ color: '#2196f3', fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                دفعة الشهر
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="info.main">
                                {Number(currentActionRow?.monthpay || 0).toLocaleString('ar-EG')} ر.س
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                textAlign: 'center',
                                p: 2,
                                bgcolor: 'white',
                                borderRadius: 2,
                                boxShadow: 1,
                              }}
                            >
                              <PaymentIcon sx={{ color: '#ff9800', fontSize: 32, mb: 1 }} />
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                الرصيد السابق
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" color="warning.main">
                                {Number(currentActionRow?.prebalance || 0).toLocaleString('ar-EG')} ر.س
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Current Status Card */}
                      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color: PRIMARY_COLOR,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 2,
                              fontWeight: 'bold',
                            }}
                          >
                            <InfoIcon /> الحالة الحالية
                          </Typography>

                          <Box
                            sx={{
                              p: 3,
                              bgcolor:
                                rowStatuses[currentActionRow?.id] === 'paid'
                                  ? '#dcfce7'
                                  : rowStatuses[currentActionRow?.id] === 'note'
                                  ? '#fef9c3'
                                  : rowStatuses[currentActionRow?.id] === 'late'
                                  ? '#fee2e2'
                                  : '#f8fafc',
                              borderRadius: 2,
                              border: '2px solid',
                              borderColor:
                                rowStatuses[currentActionRow?.id] === 'paid'
                                  ? '#4caf50'
                                  : rowStatuses[currentActionRow?.id] === 'note'
                                  ? '#ff9800'
                                  : rowStatuses[currentActionRow?.id] === 'late'
                                  ? '#f44336'
                                  : 'grey.300',
                              textAlign: 'center',
                            }}
                          >
                            <Chip
                              label={getStatusDisplayText(rowStatuses[currentActionRow?.id] || '')}
                              size="medium"
                              sx={{
                                backgroundColor:
                                  rowStatuses[currentActionRow?.id] === 'paid'
                                    ? '#4caf50'
                                    : rowStatuses[currentActionRow?.id] === 'note'
                                    ? '#ff9800'
                                    : rowStatuses[currentActionRow?.id] === 'late'
                                    ? '#f44336'
                                    : 'default',
                                color: 'white',
                                fontSize: '1.1rem',
                                py: 1.25,
                                px: 1.5,
                                mb: 2
                              }}
                            />
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                              {rowNotes[currentActionRow?.id] || 'لا توجد متابعة حالية'}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Actions Card */}
                      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ color: PRIMARY_COLOR, mb: 3, fontWeight: 'bold' }}>
                            الإجراءات السريعة
                          </Typography>

                          <Box display="flex" flexDirection="column" gap={2}>
                            {/* Status Update */}
                            <Box>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 'bold' }}>
                                تحديث الحالة
                              </Typography>
                              <FormControl fullWidth size="small">
                                <InputLabel>اختر الحالة</InputLabel>
                                <Select
                                  value={rowStatuses[currentActionRow?.id] || ''}
                                  onChange={(e) => handleStatusChange(currentActionRow?.id, e.target.value)}
                                  label="اختر الحالة"
                                >
                                  <MenuItem value="">بدون حالة</MenuItem>
                                  <MenuItem value="paid">تم السداد</MenuItem>
                                  <MenuItem value="note">متابعة</MenuItem>
                                  <MenuItem value="late">متأخر</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>

                            {/* WhatsApp Button */}
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<WhatsAppIcon />}
                              onClick={() => handleWhatsAppClick(currentActionRow?.studentTel)}
                              sx={{
                                backgroundColor: '#25D366',
                                py: 1.5,
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                borderRadius: 2,
                                '&:hover': {
                                  backgroundColor: '#1DA851',
                                  transform: 'translateY(-2px)',
                                  boxShadow: 3,
                                },
                                transition: 'all 0.3s ease',
                              }}
                            >
                              التواصل عبر واتساب
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Box>

                    {/* Right Column - Notes */}
                    <Box display="flex" flexDirection="column" gap={3}>
                      {/* Add Note Card */}
                      <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                              color: PRIMARY_COLOR,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 3,
                              fontWeight: 'bold',
                            }}
                          >
                            <HistoryIcon /> إضافة متابعة جديدة
                          </Typography>

                          <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="اكتب المتابعة الجديدة هنا..."
                            variant="outlined"
                            sx={{ mb: 3 }}
                          />
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={handleNoteSave}
                            disabled={!noteInput.trim()}
                            sx={{
                              py: 1.5,
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              borderRadius: 2,
                              backgroundColor: PRIMARY_COLOR,
                              '&:hover': {
                                backgroundColor: PRIMARY_COLOR_DARK,
                                transform: 'translateY(-2px)',
                                boxShadow: 3,
                              },
                              transition: 'all 0.3s ease',
                            }}
                          >
                            حفظ المتابعة الجديدة
                          </Button>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                )}

                {/* التبويب 2: كشف الحساب */}
                {currentTab === 1 && (
                  <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          color: PRIMARY_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                          fontWeight: 'bold',
                        }}
                      >
                        📑  الفواتير المدفوعة
                      </Typography>

                      {statementsLoading ? (
                        <Box display="flex" justifyContent="center" my={2}>
                          <div className="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary css-1idz92c-MuiCircularProgress-root" />
                        </Box>
                      ) : statements.length === 0 ? (
                        <Typography align="center" mt={1}>
                          لا توجد بيانات كشف حساب.
                        </Typography>
                      ) : (
                        <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
                            <thead>
                              <tr style={{ backgroundColor: PRIMARY_COLOR_LIGHT }}>
                                <th style={thCell}>📅 التاريخ</th>
                                <th style={thCell}>➖ دفعة الشهر</th>
                                <th style={thCell}>💰 الرصيد المتبقي عليه</th>
                                <th style={thCell}>📝 ملاحظات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {statements.map((item, idx) => (
                                <tr key={idx} style={{ borderTop: '1px solid #eee' }}>
                                  <td style={tdCell}>{item.dayDate ? item.dayDate.split('T')[0] : '-'}</td>
                                  <td style={tdCell}>{item.daen}</td>
                                  <td style={tdCell}>{item.balance}</td>
                                  <td style={{ ...tdCell, maxWidth: 200, wordWrap: 'break-word', whiteSpace: 'normal' }}>
                                    {item.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}

           {/* التبويب 3: الملف التدريبي */}
{currentTab === 2 && (
  <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
    <CardContent sx={{ p: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          color: PRIMARY_COLOR,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          fontWeight: 'bold',
        }}
      >
        📚 الملف التدريبي
      </Typography>

      {trainingLoading ? (
        <Box display="flex" justifyContent="center" my={2}>
          <div className="MuiCircularProgress-root" />
        </Box>
      ) : trainingFile.length === 0 ? (
        <Typography align="center" mt={1}>
          لا توجد بيانات متاحة.
        </Typography>
      ) : (
        <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
            <tbody>
              {trainingFile.map((item, index) => (
                <React.Fragment key={index}>
                  <tr style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>الفرع</td>
                    <td style={tdCell}>{item.branch}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>البرنامج</td>
                    <td style={tdCell}>{item.diplom}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>الدفعة</td>
                    <td style={tdCell}>{item.batch}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>المستوى</td>
                    <td style={tdCell}>{item.level}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>تاريخ البداية</td>
                    <td style={tdCell}>{item.dateStart || '---'}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>تاريخ النهاية</td>
                    <td style={tdCell}>{item.dateEnd || '---'}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>الحالة</td>
                    <td style={tdCell}>{item.status}</td>
                  </tr>
                  <tr>
                    <td style={{ ...tdCell, fontWeight: 'bold', backgroundColor: PRIMARY_COLOR_LIGHT }}>ملاحظات</td>
                    <td style={tdCell}>{item.notes}</td>
                  </tr>
                  {index < trainingFile.length - 1 && (
                    <tr>
                      <td colSpan="2" style={{ padding: '15px', backgroundColor: '#f8f9fa' }}></td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </CardContent>
  </Card>
)}
              {/* التبويب 4: سجل المتابعات */}
              {currentTab === 3 && (
                <Card sx={{ boxShadow: 3, borderRadius: 3, flex: 1 }}>
                  <CardContent sx={{ p: 3, height: '100%' }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: PRIMARY_COLOR,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 3,
                        fontWeight: 'bold',
                      }}
                    >
                      <HistoryIcon /> سجل المتابعات الكامل
                    </Typography>

                    <List
                      sx={{
                        height: 400,
                        overflow: 'auto',
                        '&::-webkit-scrollbar': { width: 8 },
                        '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: 4 },
                        '&::-webkit-scrollbar-thumb': { background: PRIMARY_COLOR, borderRadius: 4 },
                        '&::-webkit-scrollbar-thumb:hover': { background: PRIMARY_COLOR_DARK },
                      }}
                    >
                      {studentHistory[currentActionRow?.id] && studentHistory[currentActionRow?.id].length > 0 ? (
                        studentHistory[currentActionRow?.id]
                          .sort((a, b) => new Date(b.dateRecorded) - new Date(a.dateRecorded))
                          .map((record, index) => (
                            <React.Fragment key={index}>
                              <ListItem
                                alignItems="flex-start"
                                sx={{
                                  p: 2,
                                  mb: 2,
                                  bgcolor: index === 0 ? '#f0f9ff' : 'transparent',
                                  borderRadius: 2,
                                  border: index === 0 ? '2px solid' : '1px solid',
                                  borderColor: index === 0 ? PRIMARY_COLOR : 'grey.200',
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexDirection="column" gap={1}>
                                      <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                                        <Box display="flex" alignItems="center" gap={1}>
                                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                            {dayjs(record.dateRecorded).format('YYYY/MM/DD')}
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            {dayjs(record.dateRecorded).format('HH:mm')}
                                          </Typography>
                                        </Box>
                                        <Chip
                                          label={getStatusDisplayText(record.status)}
                                          size="small"
                                          sx={{
                                            backgroundColor:
                                              record.status === 'paid'
                                                ? '#4caf50'
                                                : record.status === 'note'
                                                ? '#ff9800'
                                                : record.status === 'late'
                                                ? '#f44336'
                                                : 'default',
                                            color: 'white',
                                            fontWeight: 'bold'
                                          }}
                                        />
                                      </Box>

                                      <Box display="flex" alignItems="center" gap={1} sx={{ bgcolor: '#f8fafc', p: 1, borderRadius: 1, width: '100%' }}>
                                        <PersonIcon fontSize="small" sx={{ color: PRIMARY_COLOR }} />
                                        <Typography variant="body2" sx={{ color: PRIMARY_COLOR }} fontWeight="500">
                                          المدرب: {getTrainerName(record.trainerGuid)}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  }
                                  secondary={
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        mt: 2,
                                        p: 2,
                                        bgcolor: '#f8fafc',
                                        borderRadius: 2,
                                        borderLeft: '4px solid',
                                        borderLeftColor:
                                          record.status === 'paid'
                                            ? '#4caf50'
                                            : record.status === 'note'
                                            ? '#ff9800'
                                            : record.status === 'late'
                                            ? '#f44336'
                                            : PRIMARY_COLOR,
                                      }}
                                    >
                                      {record.note || 'لا توجد متابعة'}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                              {index < studentHistory[currentActionRow?.id].length - 1 && <Divider sx={{ my: 1 }} />}
                            </React.Fragment>
                          ))
                      ) : (
                        <Typography align="center" mt={2}>
                          لا توجد متابعات مسجلة.
                        </Typography>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={() => setActionDialogOpen(false)}
              variant="contained"
              sx={{
                px: 4,
                py: 1,
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                backgroundColor: PRIMARY_COLOR,
                '&:hover': {
                  backgroundColor: PRIMARY_COLOR_DARK,
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
                transition: 'all 0.3s ease',
              }}
            >
              إغلاق النافذة
            </Button>
          </DialogActions>
        </Dialog>

        <style>{`
          .status-paid {
            background-color: #dcfce7 !important;
          }
          .status-note {
            background-color: #fef9c3 !important;
          }
          .status-late {
            background-color: #fee2e2 !important;
          }
        `}</style>
          </Box>
      </Box>
    </LocalizationProvider>
  );
};

/** @type {import('react').CSSProperties} */
const thCell = {
  fontWeight: 'bold',
  padding: '10px',
  textAlign: 'center',
  fontFamily: 'cairo',
  color: '#1e293b',
};

/** @type {import('react').CSSProperties} */
const tdCell = {
  padding: '10px',
  textAlign: 'center',
};

export default TrainerStudentGrid2;