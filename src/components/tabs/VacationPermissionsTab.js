import { hrTabIconSx } from "../hrControlStyles";
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
  Switch,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Checkbox,
  ListItemText
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { alpha } from "@mui/material/styles";
import { 
  BeachAccess, 
  Schedule, 
  CheckCircle, 
  Pending, 
  Cancel,
  Add,
  Edit,
  Delete,
  Save,
  Cancel as CancelIcon,
  Search,
  FilterList,
  Refresh,
  Person,
  Business,
  ExpandMore,
  AccessTime,
  CalendarMonth,
  Security,
  Settings,
  Group,
  HourglassEmpty,
  EventAvailable,
  EventBusy,
  Warning,
  Event,
  Today,
  DateRange
} from "@mui/icons-material";
import EmployeeProfileDialog from '../EmployeeProfileDialog';

const COLOR_SCHEME = {
  primary: '#76ae97',
  accent: '#4ecdc4',
  success: '#22c55e',
  warning: '#f59e42',
  error: '#ef4444',
  info: '#3b82f6',
  text: '#2c3e50',
  background: '#f8fafc',
  card: '#ffffff'
};

// APIs
const USERS_API_URL = 'https://api1.sstli.com/api/userinfo';
const BRANCHES_API_URL = 'https://api1.sstli.com/api/branches/all';
const PERMISSIONS_API_URL = 'https://filesregsiteration.sstli.com/erp/vacation_permissions_settings.php';
const IMAGE_API_URL = 'https://filesregsiteration.sstli.com/erp/image_api.php';

const VacationPermissionsTab = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // States للفلترة والباجينيش
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const [userImages, setUserImages] = useState({});
  const [imagesLoading, setImagesLoading] = useState({});

  // States للإجازات العامة
  const [generalVacations, setGeneralVacations] = useState([]);
  const [vacationDialog, setVacationDialog] = useState({ open: false, vacation: null });
  const [vacationForm, setVacationForm] = useState({
    title: '',
    start_date: '',
    end_date: '',
    type: 'holiday',
    repeat_yearly: false,
    description: ''
  });
  
const [bulkSettings, setBulkSettings] = useState({
  employment_start_date: '',
  annual_vacation_max_days: '',
  annual_vacation_days_per_month: '',
  annual_vacation_carry_over: false,
  annual_vacation_max_carry_over: '',
  sick_leave_max_days: '',
  sick_leave_requires_proof: false,
  sick_leave_proof_after_days: '',
  emergency_leave_max_days_month: '',
  emergency_leave_max_days_year: '',
  other_leave_max_days: '',
  other_leave_requires_approval: false,
  
  // إعدادات الإذونات
  permission_max_hours_day: '',
  permission_max_hours_month: '',
  permission_max_times_month: '',
  permission_requires_approval: false,
  
  // إعدادات القيود - منفصلة للإجازات والإذونات
  min_employment_duration: '',
  max_consecutive_days: '',
  max_consecutive_annual_days: '',
  vacation_advance_notice_days: '', // إشعار مسبق للإجازات (أيام)
  permission_advance_notice_hours: '' // إشعار مسبق للإذونات (ساعات)
});

  // تطبيق التغييرات على الإعدادات الجماعية
  const handleBulkSettingChange = (field, value) => {
    setBulkSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [profileDialog, setProfileDialog] = useState({ 
  open: false, 
  employee: null 
});

// دالة لفتح الملف الشخصي
const handleOpenProfile = (employee) => {
  setProfileDialog({ 
    open: true, 
    employee 
  });
};
  // States للديالوجات
  const [editDialog, setEditDialog] = useState({ open: false, user: null, settings: null });
  const [bulkDialog, setBulkDialog] = useState({ open: false, type: '', selectedUsers: [] });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

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

  // جلب بيانات المستخدمين
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(USERS_API_URL);
      if (!response.ok) throw new Error('فشل في جلب بيانات المستخدمين');
      
      const usersData = await response.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('فشل في جلب بيانات المستخدمين', 'error');
    } finally {
      setLoading(false);
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

  // جلب بيانات الفروع
  const fetchBranches = async () => {
    try {
      const response = await fetch(BRANCHES_API_URL);
      if (!response.ok) throw new Error('فشل في جلب بيانات الفروع');
      
      const branchesData = await response.json();
      setBranches(branchesData);
    } catch (error) {
      console.error('Error fetching branches:', error);
      showSnackbar('فشل في جلب بيانات الفروع', 'error');
    }
  };

  // جلب إعدادات الصلاحيات
  const fetchPermissions = async () => {
    try {
      const response = await fetch(PERMISSIONS_API_URL);
      const result = await response.json();
      
      if (result.success) {
        setPermissions(result.data || []);
      } else {
        showSnackbar(result.error || 'فشل في جلب الإعدادات', 'error');
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      showSnackbar('خطأ في الاتصال بالخادم', 'error');
    }
  };

  // جلب الإجازات العامة
  const fetchGeneralVacations = async () => {
    try {
      const response = await fetch(`${PERMISSIONS_API_URL}?action=special`);
      const result = await response.json();
      
      if (result.success) {
        setGeneralVacations(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching general vacations:', error);
    }
  };

  // حفظ الإعدادات
  const savePermissions = async (userGuid, settings) => {
    try {
      setSaving(true);
      const response = await fetch(PERMISSIONS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_guid: userGuid,
          ...settings
        })
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar('تم حفظ الإعدادات بنجاح');
        fetchPermissions();
        setEditDialog({ open: false, user: null, settings: null });
      } else {
        showSnackbar(result.error || 'فشل في حفظ الإعدادات', 'error');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      showSnackbar('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setSaving(false);
    }
  };

  // حفظ إجازة عامة
  const saveGeneralVacation = async (vacationData) => {
    try {
      const response = await fetch(`${PERMISSIONS_API_URL}?action=special`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vacationData)
      });

      const result = await response.json();

      if (result.success) {
        showSnackbar('تم حفظ الإجازة العامة بنجاح');
        fetchGeneralVacations();
        setVacationDialog({ open: false, vacation: null });
        setVacationForm({
          title: '',
          start_date: '',
          end_date: '',
          type: 'holiday',
          repeat_yearly: false,
          description: ''
        });
      } else {
        showSnackbar(result.error || 'فشل في حفظ الإجازة', 'error');
      }
    } catch (error) {
      console.error('Error saving general vacation:', error);
      showSnackbar('خطأ في الاتصال بالخادم', 'error');
    }
  };

  // فتح ديالوج التعديل
  const handleEditSettings = (user) => {
    const userPermissions = permissions.find(p => p.user_guid === user.guid);
    
    setEditDialog({ 
      open: true, 
      user, 
      settings: userPermissions || getEmptySettings(user.guid)
    });
  };

  // فتح ديالوج التعديل الجماعي
  const handleOpenBulkEditDialog = () => {
    if (selectedUsers.length === 0) {
      showSnackbar('يرجى اختيار موظفين أولاً', 'warning');
      return;
    }
    
    setBulkDialog({ 
      open: true, 
      type: 'bulk',
      selectedUsers: selectedUsers 
    });
  };

  // فتح ديالوج الإجازة العامة
  const handleOpenVacationDialog = (vacation = null) => {
    if (vacation) {
      setVacationForm(vacation);
      setVacationDialog({ open: true, vacation });
    } else {
      setVacationForm({
        title: '',
        start_date: '',
        end_date: '',
        type: 'holiday',
        repeat_yearly: false,
        description: ''
      });
      setVacationDialog({ open: true, vacation: null });
    }
  };

  // إعدادات فارغة
const getEmptySettings = (userGuid) => ({
  user_guid: userGuid,
  employment_start_date: null,
  annual_vacation_max_days: null,
  annual_vacation_days_per_month: null,
  annual_vacation_carry_over: null,
  annual_vacation_max_carry_over: null,
  sick_leave_max_days: null,
  sick_leave_requires_proof: null,
  sick_leave_proof_after_days: null,
  emergency_leave_max_days_month: null,
  emergency_leave_max_days_year: null,
  other_leave_max_days: null,
  other_leave_requires_approval: null,
  permission_max_hours_day: null,
  permission_max_hours_month: null,
  permission_max_times_month: null,
  permission_requires_approval: null,
  min_employment_duration: null,
  max_consecutive_days: null,
  max_consecutive_annual_days: null,
  
  vacation_advance_notice_days: null, // للإجازات (أيام)
  permission_advance_notice_hours: null // للإذونات (ساعات)
});

  // إغلاق ديالوج التعديل
  const handleCloseEditDialog = () => {
    setEditDialog({ open: false, user: null, settings: null });
  };

  // إغلاق ديالوج التعديل الجماعي
  const handleCloseBulkDialog = () => {
    setBulkDialog({ open: false, type: '', selectedUsers: [] });
    // تفريغ الإعدادات عند الإغلاق
    setBulkSettings({
      employment_start_date: '',
      annual_vacation_max_days: '',
      annual_vacation_days_per_month: '',
      annual_vacation_carry_over: false,
      annual_vacation_max_carry_over: '',
      sick_leave_max_days: '',
      sick_leave_requires_proof: false,
      sick_leave_proof_after_days: '',
      emergency_leave_max_days_month: '',
      emergency_leave_max_days_year: '',
      other_leave_max_days: '',
      other_leave_requires_approval: false,
      permission_max_hours_day: '',
      permission_max_hours_month: '',
      permission_max_times_month: '',
      permission_requires_approval: false,
      min_employment_duration: '',
      max_consecutive_days: '',
      max_consecutive_annual_days: '',
      advance_notice_days: ''
    });
  };

  // إغلاق ديالوج الإجازة العامة
  const handleCloseVacationDialog = () => {
    setVacationDialog({ open: false, vacation: null });
    setVacationForm({
      title: '',
      start_date: '',
      end_date: '',
      type: 'holiday',
      repeat_yearly: false,
      description: ''
    });
  };

  // تطبيق التغييرات على الإعدادات
  const handleSettingChange = (field, value) => {
    setEditDialog(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  // تطبيق التغييرات على نموذج الإجازة
  const handleVacationFormChange = (field, value) => {
    setVacationForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // حفظ الإعدادات
  const handleSaveSettings = () => {
    if (editDialog.user && editDialog.settings) {
      savePermissions(editDialog.user.guid, editDialog.settings);
    }
  };

  // حفظ الإجازة العامة
  const handleSaveVacation = () => {
    saveGeneralVacation(vacationForm);
  };

  // تطبيق إعدادات جماعية
  const handleBulkApply = async (settings) => {
    try {
      setSaving(true);
      const usersToApply = bulkDialog.selectedUsers;

      let successCount = 0;
      let errorCount = 0;

      for (const user of usersToApply) {
        try {
          await savePermissions(user.guid, settings);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error saving permissions for user ${user.guid}:`, error);
        }
      }

      showSnackbar(`تم تطبيق الإعدادات على ${successCount} موظف، فشل ${errorCount}`, 'success');
      setBulkDialog({ open: false, type: '', selectedUsers: [] });
      setSelectedUsers([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error in bulk apply:', error);
      showSnackbar('حدث خطأ أثناء التطبيق الجماعي', 'error');
    } finally {
      setSaving(false);
    }
  };

  // اختيار/إلغاء اختيار موظف
  const handleSelectUser = (user) => {
    const isSelected = selectedUsers.some(u => u.guid === user.guid);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.guid !== user.guid));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // اختيار/إلغاء اختيار الكل
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...filteredUsers]);
    }
    setSelectAll(!selectAll);
  };

  // اختيار مجموعة حسب اليوزر جوب
  const handleSelectByJob = (jobIds) => {
    const usersToSelect = filteredUsers.filter(user => 
      jobIds.includes(user.userJop?.toString())
    );
    setSelectedUsers(usersToSelect);
    setSelectAll(usersToSelect.length === filteredUsers.length);
  };

  // عرض الإشعارات
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // الحصول على اسم الوظيفة
  const getJobTitle = (jobId) => {
    switch (jobId) {
      case 6: return 'مدير موارد بشرية';
      case 11: return 'موظف موارد بشرية';
      case 14: return 'موظف';
      case 9: return 'مشرف';
      default: return 'موظف';
    }
  };

  // الحصول على لون الوظيفة
  const getJobColor = (jobId) => {
    switch (jobId) {
      case 6: return COLOR_SCHEME.primary;
      case 11: return COLOR_SCHEME.accent;
      case 14: return COLOR_SCHEME.info;
      case 9: return COLOR_SCHEME.warning;
      default: return COLOR_SCHEME.text;
    }
  };

  // الحصول على قيمة الإعداد أو نص افتراضي
  const getSettingValue = (settings, field, defaultValue = 'غير محدد') => {
    const value = settings?.[field];
    return value !== null && value !== undefined ? value : defaultValue;
  };

  // دالة علشان تجيب اسم الفرع من الـ GUID
  const getBranchName = (branchGuid) => {
    if (!branchGuid || branchGuid === '00000000-0000-0000-0000-000000000000') {
      return 'بدون فرع';
    }
    
    const branch = branches.find(b => b.guid === branchGuid);
    return branch ? branch.name : 'غير معروف';
  };

  // حساب مدة العمل
// حساب مدة العمل
const calculateServiceDuration = (employmentStartDate) => {
  if (!employmentStartDate) return 'غير محدد';
  
  const start = new Date(employmentStartDate);
  const now = new Date();
  
  // لحساب الفرق بالتفصيل
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  // تصحيح القيم السالبة
  if (days < 0) {
    months--;
    // حساب الأيام في الشهر السابق
    const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // بناء النص بناءً على المدة
  const parts = [];
  
  if (years > 0) {
    parts.push(`${years} سنة`);
  }
  
  if (months > 0) {
    parts.push(`${months} شهر`);
  }
  
  if (days > 0 || (years === 0 && months === 0)) {
    parts.push(`${days} يوم`);
  }

  return parts.join(' و ');
};

  // تصفية المستخدمين
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === 'all' ? true :
                         branchFilter === 'no_branch' ? 
                         (user.branchForWork === '00000000-0000-0000-0000-000000000000' || !user.branchForWork) :
                         user.branchForWork === branchFilter;
    
    const matchesJob = jobFilter === 'all' || user.userJop?.toString() === jobFilter;
    
    return matchesSearch && matchesBranch && matchesJob;
  });

  // الباجينيش
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  // تجميع البيانات عند التحميل
  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchPermissions();
    fetchGeneralVacations();
  }, []);

  // أضف هذا الـ useEffect لتحميل الصور
  useEffect(() => {
    if (users.length > 0) {
      // جلب الصور لجميع المستخدمين
      users.forEach(user => {
        if (user.guid && !userImages[user.guid]) {
          fetchUserImage(user.guid);
        }
      });
    }
  }, [users]);

  // التحقق إذا كان مستخدم موارد بشرية
  const isHRUser = () => {
    return user && (user.userJop === 6 || user.userJop === 11);
  };

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

  // كومبوننت بطاقة الإعدادات
  const SettingsCard = ({ title, icon, children, color = COLOR_SCHEME.primary }) => (
    <Card sx={{ mb: 2, borderRadius: 3 }}>
      <Box sx={{ 
        p: 2, 
        backgroundColor: alpha(color, 0.1),
        borderBottom: `1px solid ${alpha(color, 0.2)}`
      }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        {children}
      </Box>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* العنوان الرئيسي */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ 
            display: "flex", 
            alignItems: "center",
            color: COLOR_SCHEME.text,
            fontWeight: 'bold'
          }}>
            <Settings sx={{ marginInlineEnd: 2, color: COLOR_SCHEME.primary, fontSize: 32 }} /> 
            صلاحيات الإجازات والإذونات
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchUsers();
              fetchPermissions();
              fetchGeneralVacations();
            }}
            disabled={loading}
          >
            تحديث البيانات
          </Button>
        </Box>

        {/* إحصائيات سريعة */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.primary} 0%, ${alpha(COLOR_SCHEME.primary, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'transparent', boxShadow: 'none', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {users.length}
                </Typography>
                <Typography variant="body2">
                  إجمالي الموظفين
                </Typography>
              </Card>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.accent} 0%, ${alpha(COLOR_SCHEME.accent, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'transparent', boxShadow: 'none', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {permissions.length}
                </Typography>
                <Typography variant="body2">
                  تم تعديل إعداداتهم
                </Typography>
              </Card>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.success} 0%, ${alpha(COLOR_SCHEME.success, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'transparent', boxShadow: 'none', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {generalVacations.length}
                </Typography>
                <Typography variant="body2">
                  إجازات عامة
                </Typography>
              </Card>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${COLOR_SCHEME.info} 0%, ${alpha(COLOR_SCHEME.info, 0.8)} 100%)`,
              color: 'white',
              borderRadius: 3
            }}>
              <Card sx={{ p: 2, textAlign: 'center', background: 'transparent', boxShadow: 'none', color: 'white' }}>
                <Typography variant="h4" fontWeight="bold">
                  {users.filter(u => u.userJop === 6 || u.userJop === 11).length}
                </Typography>
                <Typography variant="body2">
                  موظفين موارد بشرية
                </Typography>
              </Card>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* التبويبات */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              fontWeight: 'bold',
              fontSize: '1rem',
              minHeight: 60,
            }
          }}
        >
          <Tab sx={hrTabIconSx} 
            icon={<Group />}
            iconPosition="start"
            label="إدارة صلاحيات الموظفين"
          />
          <Tab sx={hrTabIconSx} 
            icon={<Event />}
            iconPosition="start"
            label="الإجازات العامة"
          />
          <Tab sx={hrTabIconSx} 
            icon={<Settings />}
            iconPosition="start"
            label="الإعدادات العامة"
          />
        </Tabs>
      </Card>

      {activeTab === 0 ? (
        <>
          {/* فلترات البحث */}
          <Card sx={{ mb: 3, borderRadius: 3, p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="ابحث باسم الموظف..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>الفرع</InputLabel>
                  <Select
                    value={branchFilter}
                    onChange={(e) => {
                      setBranchFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    label="الفرع"
                  >
                    <MenuItem value="all">جميع الفروع</MenuItem>
                    <MenuItem value="no_branch">موظفين بدون فرع</MenuItem>
                    {branches.map((branch) => (
                      <MenuItem key={branch.guid} value={branch.guid}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth>
                  <InputLabel>المسمى الوظيفي</InputLabel>
                  <Select
                    value={jobFilter}
                    onChange={(e) => {
                      setJobFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    label="المسمى الوظيفي"
                  >
                    <MenuItem value="all">جميع المسميات</MenuItem>
                    <MenuItem value="6">مدير موارد بشرية</MenuItem>
                    <MenuItem value="11">موظف موارد بشرية</MenuItem>
                    <MenuItem value="14">موظف</MenuItem>
                    <MenuItem value="9">مشرف</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>اختيار مجموعة</InputLabel>
                  <Select
                    value=""
                    onChange={(e) => {
                      if (e.target.value === 'employees') {
                        handleSelectByJob(['14']);
                      } else if (e.target.value === 'supervisors') {
                        handleSelectByJob(['9']);
                      } else if (e.target.value === 'all_except_hr') {
                        handleSelectByJob(['14', '9']);
                      } else if (e.target.value === 'all') {
                        setSelectedUsers([...filteredUsers]);
                        setSelectAll(true);
                      }
                    }}
                    label="اختيار مجموعة"
                  >
                    <MenuItem value="employees">الموظفين فقط</MenuItem>
                    <MenuItem value="supervisors">المشرفين فقط</MenuItem>
                    <MenuItem value="all_except_hr">جميع الموظفين عدا الموارد البشرية</MenuItem>
                    <MenuItem value="all">جميع الموظفين المفلترين</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setBranchFilter('all');
                    setJobFilter('all');
                    setCurrentPage(1);
                    setSelectedUsers([]);
                    setSelectAll(false);
                  }}
                >
                  إعادة تعيين
                </Button>
              </Grid>
            </Grid>

            {/* أدوات التحديد الجماعي */}
            {selectedUsers.length > 0 && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: alpha(COLOR_SCHEME.primary, 0.1), borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="bold">
                    تم اختيار {selectedUsers.length} موظف
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={handleOpenBulkEditDialog}
                    >
                      تعديل جماعي
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedUsers([]);
                        setSelectAll(false);
                      }}
                    >
                      إلغاء الاختيار
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Card>

          {/* نتائج البحث */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="textSecondary">
              عرض {currentUsers.length} من {filteredUsers.length} موظف
            </Typography>
            <Typography variant="body2" color="textSecondary">
              الصفحة {currentPage} من {totalPages}
            </Typography>
          </Box>

          {/* جدول الموظفين */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: COLOR_SCHEME.primary }} />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: COLOR_SCHEME.background }}>
                      <TableCell>
                        <Checkbox
                          checked={selectAll}
                          onChange={handleSelectAll}
                          indeterminate={selectedUsers.length > 0 && selectedUsers.length < currentUsers.length}
                        />
                      </TableCell>
                      <TableCell><strong>الموظف</strong></TableCell>
                      <TableCell><strong>الفرع</strong></TableCell>
                      <TableCell><strong>المسمى الوظيفي</strong></TableCell>
                      <TableCell><strong>مدة العمل</strong></TableCell>
                      <TableCell><strong>الإجازات المسموحة</strong></TableCell>
                      <TableCell><strong>الإذونات المسموحة</strong></TableCell>
                      <TableCell><strong>الحالة</strong></TableCell>
                      <TableCell><strong>الإجراءات</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {currentUsers.map((user) => {
                        const userPermissions = permissions.find(p => p.user_guid === user.guid);
                        const hasSettings = !!userPermissions;
                        const isSelected = selectedUsers.some(u => u.guid === user.guid);
                        const serviceDuration = calculateServiceDuration(userPermissions?.employment_start_date);
                        
                        return (
                          <motion.tr
                            key={user.guid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                          >
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleSelectUser(user)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {imagesLoading[user.guid] ? (
                                  <Avatar sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    bgcolor: 'grey.300'
                                  }}>
                                    <CircularProgress size={16} />
                                  </Avatar>
                                ) : (
                                  <Avatar 
                                    sx={{ 
                                      width: 32, 
                                      height: 32, 
                                      bgcolor: userImages[user.guid] ? 'transparent' : getJobColor(user.userJop),
                                      fontSize: '0.875rem'
                                    }}
                                    src={userImages[user.guid]}
                                  >
                                    {!userImages[user.guid] && (user.fullName?.charAt(0) || "U")}
                                  </Avatar>
                                )}
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {user.fullName}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {user.userName}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            
                            <TableCell>
                              <Typography variant="body2">
                                {getBranchName(user.branchForWork)}
                              </Typography>
                              {(!user.branchForWork || user.branchForWork === '00000000-0000-0000-0000-000000000000') && (
                                <Chip 
                                  label="بدون فرع" 
                                  size="small" 
                                  color="warning" 
                                  variant="outlined"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </TableCell>
                            
                            <TableCell>
                              <Chip 
                                label={getJobTitle(user.userJop)}
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha(getJobColor(user.userJop), 0.1),
                                  color: getJobColor(user.userJop)
                                }}
                              />
                            </TableCell>

                            <TableCell>
                              <Typography variant="body2">
                                {serviceDuration}
                              </Typography>
                              {userPermissions?.employment_start_date && (
                                <Typography variant="caption" color="textSecondary">
                                  منذ {new Date(userPermissions.employment_start_date).toLocaleDateString('ar-EG')}
                                </Typography>
                              )}
                            </TableCell>
                            
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption">
                                  سنوية: {getSettingValue(userPermissions, 'annual_vacation_max_days')} يوم
                                </Typography>
                                <Typography variant="caption">
                                  مرضية: {getSettingValue(userPermissions, 'sick_leave_max_days')} يوم
                                </Typography>
                                <Typography variant="caption">
                                  متتالية: {getSettingValue(userPermissions, 'max_consecutive_annual_days')} يوم
                                </Typography>
                              </Box>
                            </TableCell>
                            
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="caption">
                                  {getSettingValue(userPermissions, 'permission_max_hours_day')} ساعة/يوم
                                </Typography>
                                <Typography variant="caption">
                                  {getSettingValue(userPermissions, 'permission_max_hours_month')} ساعة/شهر
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell>
                              <Chip 
                                label={hasSettings ? "معدل" : "افتراضي"}
                                size="small"
                                color={hasSettings ? "success" : "default"}
                                variant={hasSettings ? "filled" : "outlined"}
                              />
                            </TableCell>
                            
                             <TableCell>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Tooltip title="عرض الملف الشخصي">
      <IconButton 
        size="small" 
        onClick={() => handleOpenProfile(user)}
        sx={{ color: COLOR_SCHEME.info }}
      >
        <Person />
      </IconButton>
    </Tooltip>
    <Tooltip title="تعديل الإعدادات">
      <Button
        size="small"
        variant="outlined"
        startIcon={<Edit />}
        onClick={() => handleEditSettings(user)}
      >
        تعديل
      </Button>
    </Tooltip>
  </Box>
</TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
                
                {filteredUsers.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Group sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      لا توجد نتائج
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      جرب تعديل فلترات البحث
                    </Typography>
                  </Box>
                )}
              </TableContainer>

              {/* الباجينيش */}
              {filteredUsers.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </>
      ) : activeTab === 1 ? (
        /* تبويب الإجازات العامة */
        <Box>
          {/* عنوان قسم الإجازات العامة */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5">
              الإجازات العامة والرسمية
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenVacationDialog()}
            >
              إضافة إجازة عامة
            </Button>
          </Box>

          {/* جدول الإجازات العامة */}
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: COLOR_SCHEME.background }}>
                  <TableCell><strong>اسم الإجازة</strong></TableCell>
                  <TableCell><strong>النوع</strong></TableCell>
                  <TableCell><strong>من</strong></TableCell>
                  <TableCell><strong>إلى</strong></TableCell>
                  <TableCell><strong>التكرار</strong></TableCell>
                  <TableCell><strong>الإجراءات</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {generalVacations.map((vacation) => (
                  <TableRow key={vacation.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {vacation.title}
                      </Typography>
                      {vacation.description && (
                        <Typography variant="caption" color="textSecondary">
                          {vacation.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={vacation.type === 'holiday' ? 'عيد' : 
                               vacation.type === 'special' ? 'خاصة' : 'مخصصة'} 
                        size="small"
                        color={vacation.type === 'holiday' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(vacation.start_date).toLocaleDateString('ar-EG')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(vacation.end_date).toLocaleDateString('ar-EG')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={vacation.repeat_yearly ? 'سنوية' : 'مرة واحدة'} 
                        size="small"
                        variant={vacation.repeat_yearly ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="تعديل">
                          <IconButton size="small" onClick={() => handleOpenVacationDialog(vacation)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton size="small" color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {generalVacations.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Event sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  لا توجد إجازات عامة
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  قم بإضافة إجازات رسمية مثل الأعياد والإجازات الرسمية
                </Typography>
              </Box>
            )}
          </TableContainer>
        </Box>
      ) : (
        /* تبويب الإعدادات العامة */
        <Box>
          <SettingsCard 
            title="التطبيق الجماعي للإعدادات" 
            icon={<Settings />}
            color={COLOR_SCHEME.primary}
          >
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              تطبيق إعدادات موحدة على جميع الموظفين المفلترين
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Save />}
                  onClick={() => {
                    const settings = {
                      employment_start_date: null,
                      annual_vacation_max_days: 21,
                      annual_vacation_days_per_month: 1.75,
                      annual_vacation_carry_over: true,
                      annual_vacation_max_carry_over: 7,
                      sick_leave_max_days: 180,
                      sick_leave_requires_proof: true,
                      sick_leave_proof_after_days: 3,
                      emergency_leave_max_days_month: 2,
                      emergency_leave_max_days_year: 10,
                      other_leave_max_days: 5,
                      other_leave_requires_approval: true,
                      permission_max_hours_day: 2.00,
                      permission_max_hours_month: 8.00,
                      permission_max_times_month: 4,
                      permission_requires_approval: true,
                      min_employment_duration: 90,
                      max_consecutive_days: 15,
                      max_consecutive_annual_days: 15,
                      advance_notice_days: 3
                    };
                    handleBulkApply(settings);
                  }}
                  disabled={saving || filteredUsers.length === 0}
                >
                  تطبيق إعدادات افتراضية
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Delete />}
                  onClick={() => {
                    // حذف الإعدادات للجميع (تعيين كل القيم لـ null)
                    const emptySettings = {
                      employment_start_date: null,
                      annual_vacation_max_days: null,
                      annual_vacation_days_per_month: null,
                      annual_vacation_carry_over: null,
                      annual_vacation_max_carry_over: null,
                      sick_leave_max_days: null,
                      sick_leave_requires_proof: null,
                      sick_leave_proof_after_days: null,
                      emergency_leave_max_days_month: null,
                      emergency_leave_max_days_year: null,
                      other_leave_max_days: null,
                      other_leave_requires_approval: null,
                      permission_max_hours_day: null,
                      permission_max_hours_month: null,
                      permission_max_times_month: null,
                      permission_requires_approval: null,
                      min_employment_duration: null,
                      max_consecutive_days: null,
                      max_consecutive_annual_days: null,
                      advance_notice_days: null
                    };
                    handleBulkApply(emptySettings);
                  }}
                  disabled={saving || filteredUsers.length === 0}
                >
                  مسح الإعدادات
                </Button>
              </Grid>
            </Grid>
            
            {filteredUsers.length > 0 && (
              <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                سيتم تطبيق الإعدادات على {filteredUsers.length} موظف
              </Typography>
            )}
          </SettingsCard>
        </Box>
      )}

      {/* ديالوج تعديل الإعدادات */}
      <Dialog open={editDialog.open} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            تعديل صلاحيات - {editDialog.user?.fullName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {getJobTitle(editDialog.user?.userJop)} - {getBranchName(editDialog.user?.branchForWork)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {editDialog.settings && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* معلومات أساسية */}
                <Grid item xs={12}>
                  <SettingsCard title="المعلومات الأساسية" icon={<Person />}>
                    <TextField
                      fullWidth
                      label="تاريخ بداية التوظيف"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={editDialog.settings.employment_start_date || ''}
                      onChange={(e) => handleSettingChange('employment_start_date', e.target.value)}
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Today />
                          </InputAdornment>
                        )
                      }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    {editDialog.settings.employment_start_date && (
                      <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                        مدة العمل: {calculateServiceDuration(editDialog.settings.employment_start_date)}
                      </Typography>
                    )}
                  </SettingsCard>
                </Grid>

                {/* الإجازات السنوية */}
                <Grid item xs={12} md={6}>
                  <SettingsCard title="الإجازات السنوية" icon={<EventAvailable />}>
                    <TextField
                      fullWidth
                      label="الحد الأقصى للإجازة السنوية (أيام)"
                      type="number"
                      value={editDialog.settings.annual_vacation_max_days || ''}
                      onChange={(e) => handleSettingChange('annual_vacation_max_days', e.target.value ? parseInt(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <TextField
                      fullWidth
                      label="أيام الاستحقاق شهرياً"
                      type="number"
                      step="0.25"
                      value={editDialog.settings.annual_vacation_days_per_month || ''}
                      onChange={(e) => handleSettingChange('annual_vacation_days_per_month', e.target.value ? parseFloat(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editDialog.settings.annual_vacation_carry_over || false}
                          onChange={(e) => handleSettingChange('annual_vacation_carry_over', e.target.checked)}
                        />
                      }
                      label="السماح بترحيل الأيام"
                      sx={{ mb: 2 }}
                    />
                    {editDialog.settings.annual_vacation_carry_over && (
                      <TextField
                        fullWidth
                        label="الحد الأقصى للترحيل (أيام)"
                        type="number"
                        value={editDialog.settings.annual_vacation_max_carry_over || ''}
                        onChange={(e) => handleSettingChange('annual_vacation_max_carry_over', e.target.value ? parseInt(e.target.value) : null)}
                       inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    )}
                  </SettingsCard>
                </Grid>

                {/* الإجازات المرضية */}
                <Grid item xs={12} md={6}>
                  <SettingsCard title="الإجازات المرضية" icon={<EventBusy />}>
                    <TextField
                      fullWidth
                      label="الحد الأقصى للإجازة المرضية (أيام)"
                      type="number"
                      value={editDialog.settings.sick_leave_max_days || ''}
                      onChange={(e) => handleSettingChange('sick_leave_max_days', e.target.value ? parseInt(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editDialog.settings.sick_leave_requires_proof || false}
                          onChange={(e) => handleSettingChange('sick_leave_requires_proof', e.target.checked)}
                        />
                      }
                      label="يتطلب إثبات طبي"
                      sx={{ mb: 2 }}
                    />
                    {editDialog.settings.sick_leave_requires_proof && (
                      <TextField
                        fullWidth
                        label="بعد عدد الأيام"
                        type="number"
                        value={editDialog.settings.sick_leave_proof_after_days || ''}
                        onChange={(e) => handleSettingChange('sick_leave_proof_after_days', e.target.value ? parseInt(e.target.value) : null)}
                       inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    )}
                  </SettingsCard>
                </Grid>

                {/* الإجازات الطارئة */}
                <Grid item xs={12} md={6}>
                  <SettingsCard title="الإجازات الطارئة" icon={<Warning />}>
                    <TextField
                      fullWidth
                      label="الحد الأقصى شهرياً (أيام)"
                      type="number"
                      value={editDialog.settings.emergency_leave_max_days_month || ''}
                      onChange={(e) => handleSettingChange('emergency_leave_max_days_month', e.target.value ? parseInt(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <TextField
                      fullWidth
                      label="الحد الأقصى سنوياً (أيام)"
                      type="number"
                      value={editDialog.settings.emergency_leave_max_days_year || ''}
                      onChange={(e) => handleSettingChange('emergency_leave_max_days_year', e.target.value ? parseInt(e.target.value) : null)}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  </SettingsCard>
                </Grid>

                {/* الإجازات الأخرى */}
                <Grid item xs={12} md={6}>
                  <SettingsCard title="الإجازات الأخرى" icon={<BeachAccess />}>
                    <TextField
                      fullWidth
                      label="الحد الأقصى سنوياً (أيام)"
                      type="number"
                      value={editDialog.settings.other_leave_max_days || ''}
                      onChange={(e) => handleSettingChange('other_leave_max_days', e.target.value ? parseInt(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editDialog.settings.other_leave_requires_approval || false}
                          onChange={(e) => handleSettingChange('other_leave_requires_approval', e.target.checked)}
                        />
                      }
                      label="يتطلب موافقة المدير المباشر"
                    />
                  </SettingsCard>
                </Grid>

                {/* الإذونات */}
                <Grid item xs={12} md={6}>
                  <SettingsCard title="الإذونات" icon={<Schedule />}>
                    <TextField
                      fullWidth
                      label="الحد الأقصى اليومي (ساعات)"
                      type="number"
                      step="0.5"
                      value={editDialog.settings.permission_max_hours_day || ''}
                      onChange={(e) => handleSettingChange('permission_max_hours_day', e.target.value ? parseFloat(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <TextField
                      fullWidth
                      label="الحد الأقصى الشهري (ساعات)"
                      type="number"
                      step="0.5"
                      value={editDialog.settings.permission_max_hours_month || ''}
                      onChange={(e) => handleSettingChange('permission_max_hours_month', e.target.value ? parseFloat(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <TextField
                      fullWidth
                      label="الحد الأقصى للعدد الشهري"
                      type="number"
                      value={editDialog.settings.permission_max_times_month || ''}
                      onChange={(e) => handleSettingChange('permission_max_times_month', e.target.value ? parseInt(e.target.value) : null)}
                      sx={{ mb: 2 }}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editDialog.settings.permission_requires_approval || false}
                          onChange={(e) => handleSettingChange('permission_requires_approval', e.target.checked)}
                        />
                      }
                      label="يتطلب موافقة المدير المباشر"
                    />
                  </SettingsCard>
                </Grid>

                {/* القيود العامة */}
{/* القيود العامة */}
<Grid item xs={12} md={6}>
  <SettingsCard title="القيود العامة" icon={<Security />}>
    <TextField
      fullWidth
      label="أقل مدة توظيف (أيام)"
      type="number"
      value={editDialog.settings.min_employment_duration || ''}
      onChange={(e) => handleSettingChange('min_employment_duration', e.target.value ? parseInt(e.target.value) : null)}
      sx={{ mb: 2 }}
     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
    <TextField
      fullWidth
      label="الحد الأقصى للإجازات المتتالية (جميع الأنواع)"
      type="number"
      value={editDialog.settings.max_consecutive_days || ''}
      onChange={(e) => handleSettingChange('max_consecutive_days', e.target.value ? parseInt(e.target.value) : null)}
      sx={{ mb: 2 }}
     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
    <TextField
      fullWidth
      label="الحد الأقصى للإجازات السنوية المتتالية"
      type="number"
      value={editDialog.settings.max_consecutive_annual_days || ''}
      onChange={(e) => handleSettingChange('max_consecutive_annual_days', e.target.value ? parseInt(e.target.value) : null)}
      sx={{ mb: 2 }}
     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
    <TextField
      fullWidth
      label="إشعار مسبق للإجازات (أيام)"
      type="number"
      value={editDialog.settings.vacation_advance_notice_days || ''}
      onChange={(e) => handleSettingChange('vacation_advance_notice_days', e.target.value ? parseInt(e.target.value) : null)}
      sx={{ mb: 2 }}
     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
    <TextField
      fullWidth
      label="إشعار مسبق للإذونات (ساعات)"
      type="number"
      step="0.5"
      value={editDialog.settings.permission_advance_notice_hours || ''}
      onChange={(e) => handleSettingChange('permission_advance_notice_hours', e.target.value ? parseFloat(e.target.value) : null)}
     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
  </SettingsCard>
</Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} disabled={saving}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSaveSettings}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ديالوج التعديل الجماعي */}
      <Dialog open={bulkDialog.open} onClose={handleCloseBulkDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            تعديل جماعي للإعدادات
          </Typography>
          <Typography variant="body2" color="textSecondary">
            سيتم تطبيق الإعدادات على {bulkDialog.selectedUsers.length} موظف
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* المعلومات الأساسية */}
              <Grid item xs={12}>
                <SettingsCard title="المعلومات الأساسية" icon={<Person />}>
                  <TextField
                    fullWidth
                    label="تاريخ بداية التوظيف"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={bulkSettings.employment_start_date}
                    onChange={(e) => handleBulkSettingChange('employment_start_date', e.target.value)}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Today />
                        </InputAdornment>
                      )
                    }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </SettingsCard>
              </Grid>

              {/* الإجازات السنوية */}
              <Grid item xs={12} md={6}>
                <SettingsCard title="الإجازات السنوية" icon={<EventAvailable />}>
                  <TextField
                    fullWidth
                    label="الحد الأقصى للإجازة السنوية (أيام)"
                    type="number"
                    value={bulkSettings.annual_vacation_max_days}
                    onChange={(e) => handleBulkSettingChange('annual_vacation_max_days', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <TextField
                    fullWidth
                    label="أيام الاستحقاق شهرياً"
                    type="number"
                    step="0.25"
                    value={bulkSettings.annual_vacation_days_per_month}
                    onChange={(e) => handleBulkSettingChange('annual_vacation_days_per_month', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bulkSettings.annual_vacation_carry_over}
                        onChange={(e) => handleBulkSettingChange('annual_vacation_carry_over', e.target.checked)}
                      />
                    }
                    label="السماح بترحيل الأيام"
                    sx={{ mb: 2 }}
                  />
                  {bulkSettings.annual_vacation_carry_over && (
                    <TextField
                      fullWidth
                      label="الحد الأقصى للترحيل (أيام)"
                      type="number"
                      value={bulkSettings.annual_vacation_max_carry_over}
                      onChange={(e) => handleBulkSettingChange('annual_vacation_max_carry_over', e.target.value)}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  )}
                </SettingsCard>
              </Grid>

              {/* الإجازات المرضية */}
              <Grid item xs={12} md={6}>
                <SettingsCard title="الإجازات المرضية" icon={<EventBusy />}>
                  <TextField
                    fullWidth
                    label="الحد الأقصى للإجازة المرضية (أيام)"
                    type="number"
                    value={bulkSettings.sick_leave_max_days}
                    onChange={(e) => handleBulkSettingChange('sick_leave_max_days', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bulkSettings.sick_leave_requires_proof}
                        onChange={(e) => handleBulkSettingChange('sick_leave_requires_proof', e.target.checked)}
                      />
                    }
                    label="يتطلب إثبات طبي"
                    sx={{ mb: 2 }}
                  />
                  {bulkSettings.sick_leave_requires_proof && (
                    <TextField
                      fullWidth
                      label="بعد عدد الأيام"
                      type="number"
                      value={bulkSettings.sick_leave_proof_after_days}
                      onChange={(e) => handleBulkSettingChange('sick_leave_proof_after_days', e.target.value)}
                     inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  )}
                </SettingsCard>
              </Grid>

              {/* الإذونات */}
              <Grid item xs={12} md={6}>
                <SettingsCard title="الإذونات" icon={<Schedule />}>
                  <TextField
                    fullWidth
                    label="الحد الأقصى اليومي (ساعات)"
                    type="number"
                    step="0.5"
                    value={bulkSettings.permission_max_hours_day}
                    onChange={(e) => handleBulkSettingChange('permission_max_hours_day', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <TextField
                    fullWidth
                    label="الحد الأقصى الشهري (ساعات)"
                    type="number"
                    step="0.5"
                    value={bulkSettings.permission_max_hours_month}
                    onChange={(e) => handleBulkSettingChange('permission_max_hours_month', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <TextField
                    fullWidth
                    label="الحد الأقصى للعدد الشهري"
                    type="number"
                    value={bulkSettings.permission_max_times_month}
                    onChange={(e) => handleBulkSettingChange('permission_max_times_month', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bulkSettings.permission_requires_approval}
                        onChange={(e) => handleBulkSettingChange('permission_requires_approval', e.target.checked)}
                      />
                    }
                    label="يتطلب موافقة المدير المباشر"
                  />
                </SettingsCard>
              </Grid>

              {/* الإجازات الأخرى */}
              <Grid item xs={12} md={6}>
                <SettingsCard title="الإجازات الأخرى" icon={<BeachAccess />}>
                  <TextField
                    fullWidth
                    label="الحد الأقصى سنوياً (أيام)"
                    type="number"
                    value={bulkSettings.other_leave_max_days}
                    onChange={(e) => handleBulkSettingChange('other_leave_max_days', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={bulkSettings.other_leave_requires_approval}
                        onChange={(e) => handleBulkSettingChange('other_leave_requires_approval', e.target.checked)}
                      />
                    }
                    label="يتطلب موافقة المدير المباشر"
                  />
                </SettingsCard>
              </Grid>

              {/* القيود */}
              <Grid item xs={12} md={6}>
                <SettingsCard title="القيود" icon={<Security />}>
                  <TextField
                    fullWidth
                    label="أقل مدة توظيف (أيام)"
                    type="number"
                    value={bulkSettings.min_employment_duration}
                    onChange={(e) => handleBulkSettingChange('min_employment_duration', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <TextField
                    fullWidth
                    label="الحد الأقصى للإجازات المتتالية"
                    type="number"
                    value={bulkSettings.max_consecutive_days}
                    onChange={(e) => handleBulkSettingChange('max_consecutive_days', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <TextField
                    fullWidth
                    label="الحد الأقصى للإجازات السنوية المتتالية"
                    type="number"
                    value={bulkSettings.max_consecutive_annual_days}
                    onChange={(e) => handleBulkSettingChange('max_consecutive_annual_days', e.target.value)}
                    sx={{ mb: 2 }}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                  <TextField
                    fullWidth
                    label="إشعار مسبق (أيام)"
                    type="number"
                    value={bulkSettings.advance_notice_days}
                    onChange={(e) => handleBulkSettingChange('advance_notice_days', e.target.value)}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                </SettingsCard>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkDialog} disabled={saving}>
            إلغاء
          </Button>
          <Button 
            onClick={() => {
              // تحويل القيم الفارغة إلى null
              const processedSettings = {};
              Object.keys(bulkSettings).forEach(key => {
                if (bulkSettings[key] === '' || bulkSettings[key] === null) {
                  processedSettings[key] = null;
                } else {
                  processedSettings[key] = bulkSettings[key];
                }
              });
              handleBulkApply(processedSettings);
            }}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'جاري التطبيق...' : 'تطبيق الإعدادات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ديالوج الإجازات العامة */}
      <Dialog open={vacationDialog.open} onClose={handleCloseVacationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            {vacationDialog.vacation ? 'تعديل إجازة عامة' : 'إضافة إجازة عامة'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="اسم الإجازة"
              value={vacationForm.title}
              onChange={(e) => handleVacationFormChange('title', e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>نوع الإجازة</InputLabel>
              <Select
                value={vacationForm.type}
                onChange={(e) => handleVacationFormChange('type', e.target.value)}
                label="نوع الإجازة"
              >
                <MenuItem value="holiday">عيد</MenuItem>
                <MenuItem value="special">إجازة خاصة</MenuItem>
                <MenuItem value="custom">مخصصة</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="تاريخ البداية"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={vacationForm.start_date}
              onChange={(e) => handleVacationFormChange('start_date', e.target.value)}
              sx={{ mb: 2 }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField
              fullWidth
              label="تاريخ النهاية"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={vacationForm.end_date}
              onChange={(e) => handleVacationFormChange('end_date', e.target.value)}
              sx={{ mb: 2 }}
             inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <FormControlLabel
              control={
                <Switch
                  checked={vacationForm.repeat_yearly}
                  onChange={(e) => handleVacationFormChange('repeat_yearly', e.target.checked)}
                />
              }
              label="تكرار سنوي"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="وصف الإجازة (اختياري)"
              multiline
              rows={3}
              value={vacationForm.description}
              onChange={(e) => handleVacationFormChange('description', e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVacationDialog}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSaveVacation}
            variant="contained"
            disabled={!vacationForm.title || !vacationForm.start_date || !vacationForm.end_date}
          >
            {vacationDialog.vacation ? 'تحديث' : 'حفظ'}
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
        <EmployeeProfileDialog
  open={profileDialog.open}
  onClose={() => setProfileDialog({ open: false, employee: null })}
  employee={profileDialog.employee}
  permissions={permissions.find(p => p.user_guid === profileDialog.employee?.guid)}
  userImage={userImages[profileDialog.employee?.guid]}
  branches={branches} // إضافة هذا البروب
/>
    </motion.div>
    
  );
};

export default VacationPermissionsTab;