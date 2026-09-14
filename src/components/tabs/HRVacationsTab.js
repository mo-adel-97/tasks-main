import React, { useState, useEffect } from "react";
import { 
  Grid, 
  Typography, 
  Card, 
  Box, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  Divider,
  Pagination,
  Select,
  FormControl,
  InputLabel,
  CardContent
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { 
  BeachAccess, 
  Schedule, 
  CheckCircle, 
  Pending, 
  Cancel,
  Visibility,
  ThumbUp,
  ThumbDown,
  AttachFile,
  Search,
  FilterList,
  Refresh,
  Download,
  Person,
  Business,
  CalendarToday,
  AccessTime,
  Description,
  Clear
} from "@mui/icons-material";

const COLOR_SCHEME = {
  primary: '#76ae97',
  accent: '#4ecdc4',
  success: '#22c55e',
  warning: '#f59e42',
  error: '#ef4444',
  text: '#2c3e50',
  background: '#f8fafc',
  card: '#ffffff'
};

const HR_API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/hr_vacations_permissions.php';
const USER_API_URL = 'https://api1.sstli.com/api/userinfo';
const BRANCHES_API_URL = 'https://api1.sstli.com/api/branches/all';
const IMAGE_API_URL = 'https://filesregsiteration.sstli.com/erp/image_api.php'; // أضف هذا


const HRVacationsTab = ({ onPendingRequestsUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState({ open: false, request: null });
  const [actionDialog, setActionDialog] = useState({ open: false, request: null, action: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [adminNotes, setAdminNotes] = useState('');

  // الفلترات والباجينيش
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
const [userImages, setUserImages] = useState({});
const [imagesLoading, setImagesLoading] = useState({});
  // دالة للتحقق إذا الملف fake
  const isFakeFile = (fileName) => {
    return fileName && fileName.toLowerCase().includes('fake');
  };

  // جلب بيانات المستخدم من localStorage
  const getUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  const user = getUserFromLocalStorage();

  // جلب بيانات المستخدمين من API
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch(USER_API_URL);
      if (!response.ok) throw new Error('فشل في جلب بيانات المستخدمين');
      
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('فشل في جلب بيانات المستخدمين', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  // جلب بيانات الفروع من API
  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await fetch(BRANCHES_API_URL);
      if (!response.ok) throw new Error('فشل في جلب بيانات الفروع');
      
      const branchesData = await response.json();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
      showSnackbar('فشل في جلب بيانات الفروع', 'error');
    } finally {
      setBranchesLoading(false);
    }
  };

  // دالة لجلب صورة المستخدم
const fetchUserImage = async (userGuid) => {
  if (!userGuid) return null;
  
  try {
    setImagesLoading(prev => ({ ...prev, [userGuid]: true }));
    const timestamp = new Date().getTime();
    const response = await fetch(`${IMAGE_API_URL}?action=get&userGuid=${userGuid}&t=${timestamp}`);

    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setUserImages(prev => ({ ...prev, [userGuid]: url }));
      return url;
    } else {
      setUserImages(prev => ({ ...prev, [userGuid]: null }));
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching user image:", error);
    setUserImages(prev => ({ ...prev, [userGuid]: null }));
    return null;
  } finally {
    setImagesLoading(prev => ({ ...prev, [userGuid]: false }));
  }
};

  // جلب جميع الطلبات للموارد البشرية
// جلب جميع الطلبات للموارد البشرية
const fetchHRRequests = async () => {
  if (!user?.guid) return;
  
  setLoading(true);
  try {
    const response = await fetch(`${HR_API_BASE_URL}`);
    const result = await response.json();
    
    if (result.success) {
      // دمج بيانات المستخدمين والفروع مع الطلبات
      const requestsWithDetails = result.data.map(request => {
        const userData = users.find(u => u.guid === request.user_guid);
        const branchData = branches.find(b => b.guid === request.branch_for_work);
        
        return {
          ...request,
          employee_name: userData?.fullName || 'غير معروف',
          employee_job: userData?.userJop || null,
          branch_name: branchData?.name || 'غير معروف',
          request_category: request.request_type === 'إجازة' ? 'vacation' : 'permission'
        };
      });
      
      setRequests(requestsWithDetails);
      setFilteredRequests(requestsWithDetails);
      
      // حساب عدد الطلبات المعلقة وإرسالها للأب
      const pendingCount = requestsWithDetails.filter(request => request.status === 'pending').length;
      if (onPendingRequestsUpdate) {
        onPendingRequestsUpdate(pendingCount);
      }

      // جلب الصور لجميع المستخدمين بعد تحميل الطلبات
      requestsWithDetails.forEach(request => {
        if (request.user_guid) {
          fetchUserImage(request.user_guid);
        }
      });
    } else {
      showSnackbar(result.error || 'فشل في جلب البيانات', 'error');
    }
  } catch (error) {
    console.error('Error fetching HR requests:', error);
    showSnackbar('خطأ في الاتصال بالخادم', 'error');
  } finally {
    setLoading(false);
  }
};

  // تطبيق الفلترات
  useEffect(() => {
    let filtered = requests;

    // فلتر البحث
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.request_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vacation_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.permission_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلتر الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // فلتر النوع
    if (typeFilter !== 'all') {
      filtered = filtered.filter(request => request.request_category === typeFilter);
    }

    // فلتر الفرع
    if (branchFilter !== 'all') {
      filtered = filtered.filter(request => request.branch_name === branchFilter);
    }

    // فلتر التاريخ
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(request => 
            new Date(request.created_at).toDateString() === today.toDateString()
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(request => 
            new Date(request.created_at) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(request => 
            new Date(request.created_at) >= filterDate
          );
          break;
        default:
          break;
      }
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // العودة للصفحة الأولى بعد التصفية
  }, [requests, searchTerm, statusFilter, typeFilter, branchFilter, dateFilter]);

  // الباجينيش
  const indexOfLastRequest = currentPage * rowsPerPage;
  const indexOfFirstRequest = indexOfLastRequest - rowsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  useEffect(() => {
    // جلب بيانات المستخدمين والفروع أولاً
    fetchUsers();
    fetchBranches();
  }, []);

  useEffect(() => {
    // عندما تكون بيانات المستخدمين والفروع جاهزة، نجلب الطلبات
    if (users.length > 0 && branches.length > 0) {
      fetchHRRequests();
    }
  }, [users, branches]);

  useEffect(() => {
  if (requests.length > 0) {
    // جلب الصور لجميع المستخدمين في الطلبات
    requests.forEach(request => {
      if (request.user_guid && !userImages[request.user_guid]) {
        fetchUserImage(request.user_guid);
      }
    });
  }
}, [requests]);
  // التحقق إذا كان مستخدم موارد بشرية
  const isHRUser = () => {
    return user && (user.userJop === 6 || user.userJop === 11);
  };

  // التحقق إذا كان مدير موارد بشرية
  const isHRManager = () => {
    return user && user.userJop === 6;
  };

  // التحقق إذا كان يمكنه الموافقة على الطلب
  const canApproveRequest = (request) => {
    if (!isHRUser()) return false;
    if (request.status !== 'pending') return false;
    if (isHRManager()) return true;
    if (user.userJop === 11) {
      return request.user_guid !== user.guid;
    }
    return false;
  };

  // عرض الإشعارات
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // فتح ديالوج التفاصيل
  const handleShowDetails = (request) => {
    setDetailsDialog({ open: true, request });
  };

  // إغلاق ديالوج التفاصيل
  const handleCloseDetailsDialog = () => {
    setDetailsDialog({ open: false, request: null });
  };

  // فتح ديالوج الإجراء (قبول/رفض)
  const handleOpenAction = (request, action) => {
    setActionDialog({ open: true, request, action });
    setAdminNotes('');
  };

  // إغلاق ديالوج الإجراء
  const handleCloseActionDialog = () => {
    setActionDialog({ open: false, request: null, action: '' });
    setAdminNotes('');
  };

  // تنفيذ الإجراء (قبول/رفض)
  const handleExecuteAction = async () => {
    const { request, action } = actionDialog;
    
    if (!request || !user?.guid) return;

    try {
      const response = await fetch(HR_API_BASE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: request.id,
          status: action,
          hr_guid: user.guid,
          admin_notes: adminNotes
        })
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar(`تم ${action === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح`);
        handleCloseActionDialog();
        fetchHRRequests();
      } else {
        showSnackbar(result.error || `فشل في ${action === 'approved' ? 'قبول' : 'رفض'} الطلب`, 'error');
      }
    } catch (error) {
      console.error('Error executing action:', error);
      showSnackbar('خطأ في الاتصال بالخادم', 'error');
    }
  };

  // إعادة تعيين الفلترات
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setBranchFilter('all');
    setDateFilter('all');
  };

  // الحصول على لون الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return COLOR_SCHEME.success;
      case 'rejected': return COLOR_SCHEME.error;
      default: return COLOR_SCHEME.warning;
    }
  };

  // الحصول على نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'مقبولة';
      case 'rejected': return 'مرفوضة';
      default: return 'قيد المراجعة';
    }
  };

  // الحصول على أيقونة الحالة
  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      default: return <Pending />;
    }
  };

  // تنسيق التاريخ والوقت
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // الحصول على نوع الطلب كامل
  const getFullRequestType = (request) => {
    if (request.request_type === 'إجازة') {
      return `إجازة ${request.vacation_type}`;
    } else {
      return `إذن ${request.permission_type}`;
    }
  };

  // الحصول على اسم الوظيفة
  const getJobTitle = (jobId) => {
    switch (jobId) {
      case 6: return 'مدير موارد بشرية';
      case 11: return 'موظف موارد بشرية';
      case 14: return 'موظف';
      default: return 'موظف';
    }
  };

  // إحصائيات سريعة
  const getStats = () => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending').length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  if (!isHRUser()) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="error">
          غير مصرح بالوصول إلى هذه الصفحة
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          هذه الصفحة مخصصة لموظفي الموارد البشرية فقط
        </Typography>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* العنوان الرئيسي والإحصائيات */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ 
            display: "flex", 
            alignItems: "center",
            color: COLOR_SCHEME.text,
            fontWeight: 'bold'
          }}>
            <BeachAccess sx={{ marginInlineEnd: 2, color: COLOR_SCHEME.primary, fontSize: 32 }} /> 
            إدارة طلبات الإجازات والإذونات
            {isHRManager() && (
              <Chip 
                label="مدير موارد بشرية" 
                sx={{ ml: 2, backgroundColor: COLOR_SCHEME.primary, color: 'white' }}
                size="small"
              />
            )}
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchHRRequests}
            disabled={loading}
          >
            تحديث البيانات
          </Button>
        </Box>

        {/* بطاقات الإحصائيات */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${alpha(COLOR_SCHEME.primary, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  إجمالي الطلبات
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.warning} 0%, ${alpha(COLOR_SCHEME.warning, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  قيد المراجعة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.success} 0%, ${alpha(COLOR_SCHEME.success, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {stats.approved}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  مقبولة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.error} 0%, ${alpha(COLOR_SCHEME.error, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {stats.rejected}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  مرفوضة
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* فلترات البحث */}
      <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="ابحث بالاسم، الفرع، النوع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>حالة الطلب</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="حالة الطلب"
              >
                <MenuItem value="all">جميع الحالات</MenuItem>
                <MenuItem value="pending">قيد المراجعة</MenuItem>
                <MenuItem value="approved">مقبولة</MenuItem>
                <MenuItem value="rejected">مرفوضة</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>نوع الطلب</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="نوع الطلب"
              >
                <MenuItem value="all">جميع الأنواع</MenuItem>
                <MenuItem value="vacation">إجازات</MenuItem>
                <MenuItem value="permission">إذونات</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>الفرع</InputLabel>
              <Select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                label="الفرع"
              >
                <MenuItem value="all">جميع الفروع</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.guid} value={branch.name}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>الفترة</InputLabel>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                label="الفترة"
              >
                <MenuItem value="all">كل الفترات</MenuItem>
                <MenuItem value="today">اليوم</MenuItem>
                <MenuItem value="week">أسبوع</MenuItem>
                <MenuItem value="month">شهر</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={1}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Clear />}
              onClick={resetFilters}
              disabled={!searchTerm && statusFilter === 'all' && typeFilter === 'all' && branchFilter === 'all' && dateFilter === 'all'}
            >
              إعادة تعيين
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* نتائج البحث */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="textSecondary">
          عرض {currentRequests.length} من {filteredRequests.length} طلب
        </Typography>
        
        <Typography variant="body2" color="textSecondary">
          الصفحة {currentPage} من {totalPages}
        </Typography>
      </Box>

      {(loading || usersLoading || branchesLoading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: COLOR_SCHEME.primary }} />
          <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
            جاري تحميل البيانات...
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: COLOR_SCHEME.background }}>
                  <TableCell><strong>الموظف</strong></TableCell>
                  <TableCell><strong>الفرع</strong></TableCell>
                  <TableCell><strong>نوع الطلب</strong></TableCell>
                  {/* <TableCell><strong>الفترة</strong></TableCell> */}
                  {/* <TableCell><strong>المدة</strong></TableCell> */}
                  {/* <TableCell><strong>الملف</strong></TableCell> */}
                  <TableCell><strong>الحالة</strong></TableCell>
                  <TableCell><strong>تاريخ الطلب</strong></TableCell>
                  <TableCell><strong>الإجراءات</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {currentRequests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             {imagesLoading[request.user_guid] ? (
      <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.300' }}>
        <CircularProgress size={16} />
      </Avatar>
    ) : (
      <Avatar 
        sx={{ 
          width: 32, 
          height: 32, 
          bgcolor: userImages[request.user_guid] ? 'transparent' : COLOR_SCHEME.primary,
          fontSize: '0.875rem'
        }}
        src={userImages[request.user_guid]}
      >
        {!userImages[request.user_guid] && (request.employee_name?.charAt(0) || "U")}
      </Avatar>
    )}
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {request.employee_name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {getJobTitle(request.employee_job)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {request.branch_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getFullRequestType(request)}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            borderColor: request.request_type === 'إجازة' ? COLOR_SCHEME.primary : COLOR_SCHEME.accent,
                            color: request.request_type === 'إجازة' ? COLOR_SCHEME.primary : COLOR_SCHEME.accent
                          }}
                        />
                      </TableCell>
                      {/* <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday sx={{ fontSize: 14 }} />
                            {formatDateTime(request.start_date)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            إلى {formatDateTime(request.end_date)}
                          </Typography>
                        </Box>
                      </TableCell> */}
                      {/* <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {request.request_type === 'إذن' ? 
                             `${request.total_hours} ساعة` : 
                             `${request.total_days} يوم`}
                          </Typography>
                        </Box>
                      </TableCell> */}
                      {/* <TableCell>
                        {request.attached_file && !isFakeFile(request.attached_file) ? (
                          <Tooltip title="عرض الملف المرفق">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<AttachFile />}
                              href={`https://filesregsiteration.sstli.com/erp/uploads/requests/${request.attached_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              ملف
                            </Button>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            بدون ملف
                          </Typography>
                        )}
                      </TableCell> */}
                      <TableCell>
                        <Chip 
                          label={getStatusText(request.status)}
                          size="small"
                          icon={getStatusIcon(request.status)}
                          sx={{ 
                            backgroundColor: alpha(getStatusColor(request.status), 0.1),
                            color: getStatusColor(request.status),
                            fontWeight: 'bold',
                            '& .MuiChip-icon': { color: 'inherit' }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(request.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Tooltip title="عرض التفاصيل">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Visibility />}
                              onClick={() => handleShowDetails(request)}
                            >
                              عرض
                            </Button>
                          </Tooltip>
                          
                          {canApproveRequest(request) && (
                            <>
                              <Tooltip title="قبول الطلب">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<ThumbUp />}
                                  onClick={() => handleOpenAction(request, 'approved')}
                                >
                                  قبول
                                </Button>
                              </Tooltip>
                              <Tooltip title="رفض الطلب">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  startIcon={<ThumbDown />}
                                  onClick={() => handleOpenAction(request, 'rejected')}
                                >
                                  رفض
                                </Button>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            
            {filteredRequests.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <BeachAccess sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  {requests.length === 0 ? 'لا توجد طلبات' : 'لا توجد نتائج مطابقة للبحث'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {requests.length === 0 ? 'لم يتم تقديم أي طلبات حتى الآن' : 'جرب تعديل فلترات البحث'}
                </Typography>
              </Box>
            )}
          </TableContainer>

          {/* الباجينيش */}
          {filteredRequests.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* ديالوج تفاصيل الطلب */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />
            تفاصيل الطلب
          </Typography>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.request && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    اسم الموظف:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {detailsDialog.request.employee_name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    الفرع:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {detailsDialog.request.branch_name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    نوع الطلب:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {getFullRequestType(detailsDialog.request)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    المسمى الوظيفي:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {getJobTitle(detailsDialog.request.employee_job)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    تاريخ البداية:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateTime(detailsDialog.request.start_date)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    تاريخ النهاية:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateTime(detailsDialog.request.end_date)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    المدة:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {detailsDialog.request.request_type === 'إذن' ? 
                     `${detailsDialog.request.total_hours} ساعة` : 
                     `${detailsDialog.request.total_days} يوم`}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    حالة الطلب:
                  </Typography>
                  <Chip 
                    label={getStatusText(detailsDialog.request.status)}
                    sx={{ 
                      backgroundColor: alpha(getStatusColor(detailsDialog.request.status), 0.1),
                      color: getStatusColor(detailsDialog.request.status),
                      fontWeight: 'bold'
                    }}
                  />
                </Grid>

                {/* الملف المرفق */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    الملف المرفق:
                  </Typography>
                  {detailsDialog.request.attached_file && !isFakeFile(detailsDialog.request.attached_file) ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AttachFile />}
                        href={`https://filesregsiteration.sstli.com/erp/uploads/requests/${detailsDialog.request.attached_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        عرض الملف المرفق
                      </Button>
                      <Typography variant="caption" color="textSecondary">
                        {detailsDialog.request.attached_file}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      {isFakeFile(detailsDialog.request.attached_file) ? 'بدون ملف' : 'لا يوجد ملف مرفق'}
                    </Typography>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    سبب الطلب:
                  </Typography>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body1">
                      {detailsDialog.request.reason}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailsDialog}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* ديالوج الإجراء (قبول/رفض) */}
      <Dialog open={actionDialog.open} onClose={handleCloseActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {actionDialog.action === 'approved' ? 'قبول الطلب' : 'رفض الطلب'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              هل أنت متأكد من {actionDialog.action === 'approved' ? 'قبول' : 'رفض'} هذا الطلب؟
            </Typography>
            
            <TextField
              fullWidth
              label="ملاحظات إدارية (اختياري)"
              multiline
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              sx={{ mt: 2 }}
              placeholder="أضف ملاحظاتك هنا..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActionDialog}>
            إلغاء
          </Button>
          <Button 
            onClick={handleExecuteAction}
            variant="contained"
            color={actionDialog.action === 'approved' ? 'success' : 'error'}
          >
            {actionDialog.action === 'approved' ? 'قبول' : 'رفض'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar للإشعارات */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default HRVacationsTab;