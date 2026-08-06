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
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { alpha } from "@mui/material/styles";
import Swal from 'sweetalert2';
import { 
  BeachAccess, 
  Schedule, 
  CheckCircle, 
  Pending, 
  Cancel,
  Add,
  Delete,
  Download,
  AccessTime,
  CalendarToday,
  Person,
  Warning,
  ThumbUp,
  ThumbDown,
  AttachFile,
  FilterList,
  Refresh,
  EventAvailable,
  EventBusy,
  LocalHospital,
  MoreTime,
  Timer,
  CalendarMonth,
  HourglassEmpty,
  ReportProblem,
  Security,
  Today
} from "@mui/icons-material";

const COLOR_SCHEME = {
  primary: '#76ae97',
  accent: '#4ecdc4',
  success: '#22c55e',
  warning: '#f59e42',
  error: '#ef4444',
  info: '#3b82f6',
  text: '#2c3e50',
  background: '#f8fafc'
};

const API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/vacations_permissions.php';
const LIMITS_API_URL = 'https://filesregsiteration.sstli.com/erp/vacation_permissions_settings.php';
const STATS_API_URL = 'https://filesregsiteration.sstli.com/erp/vacation_permissions_stats.php';

const VacationsTab = ({ employeeData }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, request: null });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, request: null });
  const [activeTab, setActiveTab] = useState(0);
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    request_type: 'إجازة',
    vacation_type: '',
    permission_type: '',
    start_date: '',
    end_date: '',
    reason: '',
    attached_file: null
  });
  const [fileName, setFileName] = useState('');

  // قيود المستخدم
// قيود المستخدم
const [userLimits, setUserLimits] = useState({
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
  vacation_advance_notice_days: null, // إضافة هذا الحقل
  permission_advance_notice_hours: null // إضافة هذا الحقل
});

  const [usedPermissions, setUsedPermissions] = useState({
    annual_vacation_used: 0,
    sick_leave_used: 0,
    emergency_leave_used_month: 0,
    emergency_leave_used_year: 0,
    other_leave_used: 0,
    permission_hours_used_month: 0,
    permission_times_used_month: 0
  });

  // دالة لعرض التنبيهات
  const showAlert = (title, message, icon = 'success', confirmButtonText = 'حسناً') => {
    return Swal.fire({
      title: title,
      text: message,
      icon: icon,
      confirmButtonText: confirmButtonText,
      confirmButtonColor: COLOR_SCHEME.primary,
      customClass: {
        popup: 'sweet-alert-arabic'
      }
    });
  };

  // دالة لعرض تنبيه تأكيد
  const showConfirm = (title, message, confirmButtonText = 'نعم', cancelButtonText = 'إلغاء') => {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: COLOR_SCHEME.error,
      cancelButtonColor: COLOR_SCHEME.primary,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      customClass: {
        popup: 'sweet-alert-arabic'
      }
    });
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

  // جلب جميع الطلبات
  const fetchRequests = async () => {
    if (!user?.guid) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}?user_guid=${user.guid}`);
      const result = await response.json();
      
      if (result.success) {
        setRequests(result.data || []);
      } else {
        showAlert('خطأ', result.error || 'فشل في جلب البيانات', 'error');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showAlert('خطأ', 'خطأ في الاتصال بالخادم', 'error');
    } finally {
      setLoading(false);
    }
  };

  // جلب قيود المستخدم من API
// جلب قيود المستخدم من API
// جلب قيود المستخدم من API
const fetchUserLimits = async () => {
  if (!user?.guid) return;
  
  try {
    const response = await fetch(`${LIMITS_API_URL}?user_guid=${user.guid}`);
    const result = await response.json();
    
    if (result.success && result.data) {
      let userData;
      
      // البحث عن بيانات المستخدم الحالي في المصفوفة
      if (Array.isArray(result.data)) {
        userData = result.data.find(item => item.user_guid === user.guid);
      } else {
        userData = result.data;
      }
      
      if (userData) {
        setUserLimits({
          employment_start_date: userData.employment_start_date,
          annual_vacation_max_days: userData.annual_vacation_max_days,
          annual_vacation_days_per_month: userData.annual_vacation_days_per_month,
          annual_vacation_carry_over: Boolean(userData.annual_vacation_carry_over),
          annual_vacation_max_carry_over: userData.annual_vacation_max_carry_over,
          sick_leave_max_days: userData.sick_leave_max_days,
          sick_leave_requires_proof: Boolean(userData.sick_leave_requires_proof),
          sick_leave_proof_after_days: userData.sick_leave_proof_after_days,
          emergency_leave_max_days_month: userData.emergency_leave_max_days_month,
          emergency_leave_max_days_year: userData.emergency_leave_max_days_year,
          other_leave_max_days: userData.other_leave_max_days,
          other_leave_requires_approval: Boolean(userData.other_leave_requires_approval),
          permission_max_hours_day: parseFloat(userData.permission_max_hours_day),
          permission_max_hours_month: parseFloat(userData.permission_max_hours_month),
          permission_max_times_month: userData.permission_max_times_month,
          permission_requires_approval: Boolean(userData.permission_requires_approval),
          min_employment_duration: userData.min_employment_duration,
          max_consecutive_days: userData.max_consecutive_days,
          max_consecutive_annual_days: userData.max_consecutive_annual_days,
          vacation_advance_notice_days: userData.vacation_advance_notice_days, // إضافة هذا
          permission_advance_notice_hours: userData.permission_advance_notice_hours // إضافة هذا
        });
      }
    }
  } catch (error) {
    console.error('Error fetching user limits:', error);
  }
};

  // جلب الإحصائيات المستخدمة
  const fetchUsedPermissions = async () => {
    if (!user?.guid) return;
    
    try {
      const response = await fetch(`${STATS_API_URL}?user_guid=${user.guid}`);
      const result = await response.json();
      
      if (result.success) {
        setUsedPermissions(result.data || {
          annual_vacation_used: 0,
          sick_leave_used: 0,
          emergency_leave_used_month: 0,
          emergency_leave_used_year: 0,
          other_leave_used: 0,
          permission_hours_used_month: 0,
          permission_times_used_month: 0
        });
      }
    } catch (error) {
      console.error('Error fetching used permissions:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchUserLimits();
    fetchUsedPermissions();
  }, [user?.guid]);

  // التعامل مع تغيير نوع الطلب
  const handleRequestTypeChange = (type) => {
    setFormData({
      ...formData,
      request_type: type,
      vacation_type: type === 'إجازة' ? 'سنوية' : '',
      permission_type: type === 'إذن' ? 'شخصي' : ''
    });
  };

  // التعامل مع اختيار الملف
  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        showAlert('خطأ', 'حجم الملف يجب أن يكون أقل من 5MB', 'error');
        return;
      }
      
      setFormData({ ...formData, attached_file: file });
      setFileName(file.name);
      showAlert('تم بنجاح', 'تم اختيار الملف بنجاح', 'success');
    }
  };

  // حساب مدة العمل
// حساب مدة العمل
const calculateServiceDuration = () => {
  if (!userLimits.employment_start_date) return 'غير محدد';
  
  const start = new Date(userLimits.employment_start_date);
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

  // حساب المتبقي من كل نوع
  const calculateRemaining = () => {
    return {
      // الإجازات السنوية
      annual_vacation_remaining: Math.max(0, userLimits.annual_vacation_max_days - usedPermissions.annual_vacation_used),
      annual_vacation_percentage: (usedPermissions.annual_vacation_used / userLimits.annual_vacation_max_days) * 100,
      
      // الإجازات المرضية
      sick_leave_remaining: Math.max(0, userLimits.sick_leave_max_days - usedPermissions.sick_leave_used),
      sick_leave_percentage: (usedPermissions.sick_leave_used / userLimits.sick_leave_max_days) * 100,
      
      // الإجازات الطارئة (شهري)
      emergency_leave_month_remaining: Math.max(0, userLimits.emergency_leave_max_days_month - usedPermissions.emergency_leave_used_month),
      emergency_leave_month_percentage: (usedPermissions.emergency_leave_used_month / userLimits.emergency_leave_max_days_month) * 100,
      
      // الإجازات الطارئة (سنوي)
      emergency_leave_year_remaining: Math.max(0, userLimits.emergency_leave_max_days_year - usedPermissions.emergency_leave_used_year),
      emergency_leave_year_percentage: (usedPermissions.emergency_leave_used_year / userLimits.emergency_leave_max_days_year) * 100,
      
      // الإجازات الأخرى
      other_leave_remaining: Math.max(0, userLimits.other_leave_max_days - usedPermissions.other_leave_used),
      other_leave_percentage: (usedPermissions.other_leave_used / userLimits.other_leave_max_days) * 100,
      
      // الإذونات (ساعات)
      permission_hours_remaining: Math.max(0, userLimits.permission_max_hours_month - usedPermissions.permission_hours_used_month),
      permission_hours_percentage: (usedPermissions.permission_hours_used_month / userLimits.permission_max_hours_month) * 100,
      
      // الإذونات (مرات)
      permission_times_remaining: Math.max(0, userLimits.permission_max_times_month - usedPermissions.permission_times_used_month),
      permission_times_percentage: (usedPermissions.permission_times_used_month / userLimits.permission_max_times_month) * 100,
      
      // الإذونات اليومية
      permission_daily_remaining: userLimits.permission_max_hours_day
    };
  };

  const remaining = calculateRemaining();

  // التحقق من القيود قبل تقديم الطلب
  const validateRequest = (requestData) => {
    const startDate = new Date(requestData.start_date);
    const endDate = new Date(requestData.end_date);
    const today = new Date();
    
    // حساب المدة
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const hoursDiff = Math.ceil(timeDiff / (1000 * 3600));
    
    // التحقق من تاريخ بداية التوظيف
    if (userLimits.employment_start_date) {
      const employmentStart = new Date(userLimits.employment_start_date);
      if (startDate < employmentStart) {
        return {
          valid: false,
          message: `لا يمكن طلب إجازة قبل تاريخ بداية التوظيف (${new Date(userLimits.employment_start_date).toLocaleDateString('ar-EG')})`
        };
      }
    }
    
    // التحقق من الحد الأدنى لمدة التوظيف
    if (userLimits.min_employment_duration) {
      const employmentDuration = Math.ceil((today - new Date(userLimits.employment_start_date || today)) / (1000 * 3600 * 24));
      if (employmentDuration < userLimits.min_employment_duration) {
        return {
          valid: false,
          message: `غير مسموح بتقديم طلبات قبل ${userLimits.min_employment_duration} يوم من التوظيف`
        };
      }
    }
    
    // التحقق من الإشعار المسبق
    if (userLimits.advance_notice_days) {
      const noticeDays = Math.ceil((startDate - today) / (1000 * 3600 * 24));
      if (noticeDays < userLimits.advance_notice_days) {
        return {
          valid: false,
          message: `يجب تقديم الطلب قبل ${userLimits.advance_notice_days} أيام على الأقل من تاريخ البداية`
        };
      }
    }
    
// التحقق من الإشعار المسبق
if (requestData.request_type === 'إجازة' && userLimits.vacation_advance_notice_days) {
  const noticeDays = Math.ceil((startDate - today) / (1000 * 3600 * 24));
  if (noticeDays < userLimits.vacation_advance_notice_days) {
    return {
      valid: false,
      message: `يجب تقديم طلب الإجازة قبل ${userLimits.vacation_advance_notice_days} أيام على الأقل من تاريخ البداية`
    };
  }
}

if (requestData.request_type === 'إذن' && userLimits.permission_advance_notice_hours) {
  const noticeHours = Math.ceil((startDate - today) / (1000 * 3600));
  if (noticeHours < userLimits.permission_advance_notice_hours) {
    return {
      valid: false,
      message: `يجب تقديم طلب الإذن قبل ${userLimits.permission_advance_notice_hours} ساعة على الأقل من وقت البداية`
    };
  }
}
    
    return { valid: true, message: '' };
  };

  // إرسال طلب جديد
  const handleSubmit = async () => {
    if (!user?.guid) {
      showAlert('خطأ', 'بيانات المستخدم غير متوفرة', 'error');
      return;
    }

    if (!formData.start_date || !formData.end_date || !formData.reason) {
      showAlert('خطأ', 'يرجى ملء جميع الحقول المطلوبة', 'error');
      return;
    }

    if (formData.request_type === 'إجازة' && !formData.vacation_type) {
      showAlert('خطأ', 'يرجى اختيار نوع الإجازة', 'error');
      return;
    }

    if (formData.request_type === 'إذن' && !formData.permission_type) {
      showAlert('خطأ', 'يرجى اختيار نوع الإذن', 'error');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      showAlert('خطأ', 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية', 'error');
      return;
    }

    // التحقق من القيود
    const validation = validateRequest(formData);
    if (!validation.valid) {
      showAlert('خطأ', validation.message, 'error');
      return;
    }

    setSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('user_guid', user.guid);
    formDataToSend.append('branch_for_work', user.branchForWork || user.branchGuid);
    formDataToSend.append('request_type', formData.request_type);
    formDataToSend.append('vacation_type', formData.vacation_type);
    formDataToSend.append('permission_type', formData.permission_type);
    formDataToSend.append('start_date', formData.start_date);
    formDataToSend.append('end_date', formData.end_date);
    formDataToSend.append('reason', formData.reason);
    
    let fileToSend = formData.attached_file;
    
    if (!fileToSend) {
      const fakeContent = `ملف وهمي تلقائي للطلب
نوع الطلب: ${formData.request_type}
التاريخ: ${new Date().toLocaleString('ar-EG')}
تم إنشاؤه تلقائياً لأن المستخدم لم يرفع ملف`;
      
      const blob = new Blob([fakeContent], { type: 'text/plain' });
      fileToSend = new File([blob], "fake.txt", { type: 'text/plain' });
    }
    
    formDataToSend.append('attached_file', fileToSend);

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (result.success) {
        showAlert('تم بنجاح', 'تم إرسال الطلب بنجاح', 'success');
        setOpenDialog(false);
        setFormData({
          request_type: 'إجازة',
          vacation_type: '',
          permission_type: '',
          start_date: '',
          end_date: '',
          reason: '',
          attached_file: null
        });
        setFileName('');
        fetchRequests();
        fetchUsedPermissions(); // تحديث الإحصائيات
      } else {
        showAlert('خطأ', result.error || 'فشل في إرسال الطلب', 'error');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      showAlert('خطأ', 'خطأ في الاتصال بالخادم', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // الحذف
  const handleDeleteClick = async (request) => {
    const result = await showConfirm(
      'تأكيد الحذف',
      `هل أنت متأكد من أنك تريد حذف طلب ${getFullRequestType(request)}؟ هذا الإجراء لا يمكن التراجع عنه.`,
      'نعم، احذف',
      'إلغاء'
    );

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${API_BASE_URL}?id=${request.id}`, {
          method: 'DELETE'
        });

        const deleteResult = await response.json();

        if (deleteResult.success) {
          showAlert('تم بنجاح', 'تم حذف الطلب بنجاح', 'success');
          fetchRequests();
          fetchUsedPermissions(); // تحديث الإحصائيات
        } else {
          showAlert('خطأ', deleteResult.error || 'فشل في حذف الطلب', 'error');
        }
      } catch (error) {
        console.error('Error deleting request:', error);
        showAlert('خطأ', 'خطأ في الاتصال بالخادم', 'error');
      }
    }
  };

  // التفاصيل
  const handleShowDetails = (request) => {
    setDetailsDialog({ open: true, request });
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialog({ open: false, request: null });
  };

  // تحميل الملف
  const handleDownloadFile = (fileUrl) => {
    window.open(fileUrl, '_blank');
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
      case 'approved': return <ThumbUp />;
      case 'rejected': return <ThumbDown />;
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

  // تنسيق الوقت فقط
  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // تنسيق المدة
  const formatDuration = (request) => {
    if (request.request_type === 'إذن') {
      return `${request.total_hours} ساعة`;
    } else {
      return `${request.total_days} يوم`;
    }
  };

  // الحصول على نوع الطلب كامل
  const getFullRequestType = (request) => {
    if (request.request_type === 'إجازة') {
      return `إجازة ${request.vacation_type}`;
    } else {
      return `إذن ${request.permission_type}`;
    }
  };

  // التحقق إذا كان الملف ملف فيك
  const isFakeFile = (fileName) => {
    return fileName && (fileName.includes('fake') || fileName === 'fake_request_file.txt');
  };

  // تصفية الطلبات حسب التبويب النشط
  const filteredRequests = requests.filter(request => {
    if (activeTab === 0) return request.request_type === 'إجازة';
    if (activeTab === 1) return request.request_type === 'إذن';
    return true;
  }).filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  // إحصائيات
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    vacations: requests.filter(r => r.request_type === 'إجازة').length,
    permissions: requests.filter(r => r.request_type === 'إذن').length
  };

  // كومبوننت بطاقة القيود
  const LimitsCard = () => (
    <Card sx={{ mb: 3, p: 3, borderRadius: 3, bgcolor: alpha(COLOR_SCHEME.primary, 0.05) }}>
      <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Timer sx={{ color: COLOR_SCHEME.primary }} />
        القيود المسموحة لك
      </Typography>
      
      {/* معلومات مدة العمل */}
      {userLimits.employment_start_date && (
        <Box sx={{ mb: 3, p: 2, bgcolor: alpha(COLOR_SCHEME.info, 0.1), borderRadius: 2 }}>
          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Today sx={{ color: COLOR_SCHEME.info }} />
            <strong>مدة العمل:</strong> {calculateServiceDuration()}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            تاريخ بداية التوظيف: {new Date(userLimits.employment_start_date).toLocaleDateString('ar-EG')}
          </Typography>
        </Box>
      )}
      
      <Grid container spacing={3}>
        {/* الإجازات السنوية */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <EventAvailable sx={{ fontSize: 32, color: COLOR_SCHEME.primary, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.primary}>
              {remaining.annual_vacation_remaining}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              يوم إجازة سنوية متبقية
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(remaining.annual_vacation_percentage, 100)} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: alpha(COLOR_SCHEME.primary, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 
                    remaining.annual_vacation_percentage > 80 ? COLOR_SCHEME.error :
                    remaining.annual_vacation_percentage > 60 ? COLOR_SCHEME.warning :
                    COLOR_SCHEME.success
                }
              }} 
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              {usedPermissions.annual_vacation_used} / {userLimits.annual_vacation_max_days} يوم مستخدم
            </Typography>
            <Box sx={{ mt: 1, p: 1, bgcolor: alpha(COLOR_SCHEME.primary, 0.1), borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">
                متتالية: {userLimits.max_consecutive_annual_days} يوم
              </Typography>
            </Box>
          </Card>
        </Grid>
        
        {/* الإجازات المرضية */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <LocalHospital sx={{ fontSize: 32, color: COLOR_SCHEME.warning, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.warning}>
              {remaining.sick_leave_remaining}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              يوم إجازة مرضية متبقية
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(remaining.sick_leave_percentage, 100)} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: alpha(COLOR_SCHEME.warning, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: COLOR_SCHEME.warning
                }
              }} 
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              {usedPermissions.sick_leave_used} / {userLimits.sick_leave_max_days} يوم مستخدم
            </Typography>
          </Card>
        </Grid>
        
        {/* الإجازات الطارئة */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <ReportProblem sx={{ fontSize: 32, color: COLOR_SCHEME.error, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.error}>
              {remaining.emergency_leave_month_remaining}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              يوم إجازة طارئة (شهري)
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(remaining.emergency_leave_month_percentage, 100)} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: alpha(COLOR_SCHEME.error, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: COLOR_SCHEME.error
                }
              }} 
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              {usedPermissions.emergency_leave_used_month} / {userLimits.emergency_leave_max_days_month} يوم مستخدم
            </Typography>
          </Card>
        </Grid>
        
        {/* الإذونات */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <Schedule sx={{ fontSize: 32, color: COLOR_SCHEME.info, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.info}>
              {remaining.permission_hours_remaining.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              ساعة إذن متبقية (شهري)
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(remaining.permission_hours_percentage, 100)} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: alpha(COLOR_SCHEME.info, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: COLOR_SCHEME.info
                }
              }} 
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              {usedPermissions.permission_hours_used_month.toFixed(1)} / {userLimits.permission_max_hours_month} ساعة مستخدمة
            </Typography>
            <Box sx={{ mt: 1, p: 1, bgcolor: alpha(COLOR_SCHEME.info, 0.1), borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary">
                الحد اليومي: {userLimits.permission_max_hours_day} ساعة
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* الإجازات الأخرى */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <MoreTime sx={{ fontSize: 32, color: COLOR_SCHEME.accent, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.accent}>
              {remaining.other_leave_remaining}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              يوم إجازة أخرى متبقية
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(remaining.other_leave_percentage, 100)} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: alpha(COLOR_SCHEME.accent, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: COLOR_SCHEME.accent
                }
              }} 
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              {usedPermissions.other_leave_used} / {userLimits.other_leave_max_days} يوم مستخدم
            </Typography>
          </Card>
        </Grid>

        {/* عدد مرات الإذن */}
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card sx={{ p: 2, textAlign: 'center', borderRadius: 2, height: '100%' }}>
            <HourglassEmpty sx={{ fontSize: 32, color: COLOR_SCHEME.success, mb: 1 }} />
            <Typography variant="h5" fontWeight="bold" color={COLOR_SCHEME.success}>
              {remaining.permission_times_remaining}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              مرة إذن متبقية (شهري)
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(remaining.permission_times_percentage, 100)} 
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: alpha(COLOR_SCHEME.success, 0.2),
                '& .MuiLinearProgress-bar': {
                  backgroundColor: COLOR_SCHEME.success
                }
              }} 
            />
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
              {usedPermissions.permission_times_used_month} / {userLimits.permission_max_times_month} مرة مستخدمة
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Card>
  );

  const RequestCard = ({ request }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          p: 3, 
          mb: 2,
          borderRadius: 3,
          border: `1px solid ${alpha(getStatusColor(request.status), 0.2)}`,
          background: `linear-gradient(135deg, ${alpha(getStatusColor(request.status), 0.05)} 0%, ${alpha('#ffffff', 0.1)} 100%)`,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${alpha(getStatusColor(request.status), 0.15)}`,
          }
        }}
        onClick={() => handleShowDetails(request)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: alpha(getStatusColor(request.status), 0.1),
              color: getStatusColor(request.status),
              width: 48,
              height: 48
            }}>
              {request.request_type === 'إجازة' ? <BeachAccess /> : <Schedule />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                {getFullRequestType(request)}
              </Typography>
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
            </Box>
          </Box>
          
          {request.status === 'pending' && (
            <Tooltip title="حذف الطلب">
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(request);
                }}
                sx={{ 
                  color: COLOR_SCHEME.error,
                  '&:hover': {
                    backgroundColor: alpha(COLOR_SCHEME.error, 0.1)
                  }
                }}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  من
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDateTime(request.start_date)}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Box>
                <Typography variant="caption" color="textSecondary">
                  إلى
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatDateTime(request.end_date)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight="medium">
              {formatDuration(request)}
            </Typography>
          </Box>
          
          {request.attached_file && !isFakeFile(request.attached_file) && (
            <Tooltip title="تحميل الملف المرفق">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadFile(request.file_url);
                }}
                sx={{ 
                  color: COLOR_SCHEME.primary,
                  '&:hover': {
                    backgroundColor: alpha(COLOR_SCHEME.primary, 0.1)
                  }
                }}
              >
                <AttachFile />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {request.reason && (
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(COLOR_SCHEME.primary, 0.05), borderRadius: 2 }}>
            <Typography variant="body2" sx={{ 
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {request.reason}
            </Typography>
          </Box>
        )}
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* العنوان والإحصائيات */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ 
            display: "flex", 
            alignItems: "center",
            color: COLOR_SCHEME.text,
            fontWeight: 'bold'
          }}>
            <BeachAccess sx={{ mr: 2, color: COLOR_SCHEME.primary, fontSize: 32 }} /> 
            الإجازات والإذونات
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            sx={{
              backgroundColor: COLOR_SCHEME.primary,
              borderRadius: 3,
              px: 3,
              '&:hover': {
                backgroundColor: alpha(COLOR_SCHEME.primary, 0.8),
              }
            }}
          >
            طلب جديد
          </Button>
        </Box>

        {/* بطاقة القيود */}
        <LimitsCard />

        {/* بطاقات الإحصائيات */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.primary}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                إجمالي الطلبات
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.warning}>
                {stats.pending}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                قيد المراجعة
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.success}>
                {stats.approved}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                مقبولة
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.error}>
                {stats.rejected}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                مرفوضة
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.accent}>
                {stats.vacations}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                إجازات
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* التبويبات والفلترات */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
            <Tab 
              icon={<BeachAccess />}
              iconPosition="start"
              label={
                <Badge badgeContent={stats.vacations} color="primary" sx={{ mr: 1 }}>
                  الإجازات
                </Badge>
              }
            />
            <Tab 
              icon={<Schedule />}
              iconPosition="start"
              label={
                <Badge badgeContent={stats.permissions} color="primary" sx={{ mr: 1 }}>
                  الإذونات
                </Badge>
              }
            />
          </Tabs>
        </Box>

        <Box sx={{ p: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="الكل"
            variant={filter === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilter('all')}
            color="primary"
          />
          <Chip
            label="قيد المراجعة"
            variant={filter === 'pending' ? 'filled' : 'outlined'}
            onClick={() => setFilter('pending')}
            color="warning"
          />
          <Chip
            label="مقبولة"
            variant={filter === 'approved' ? 'filled' : 'outlined'}
            onClick={() => setFilter('approved')}
            color="success"
          />
          <Chip
            label="مرفوضة"
            variant={filter === 'rejected' ? 'filled' : 'outlined'}
            onClick={() => setFilter('rejected')}
            color="error"
          />
        </Box>
      </Card>

      {/* قائمة الطلبات */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: COLOR_SCHEME.primary }} />
        </Box>
      ) : (
        <Box>
          <AnimatePresence>
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </AnimatePresence>

          {filteredRequests.length === 0 && (
            <Card sx={{ textAlign: 'center', py: 8, borderRadius: 3 }}>
              {activeTab === 0 ? (
                <BeachAccess sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              ) : (
                <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              )}
              <Typography variant="h6" color="textSecondary" gutterBottom>
                لا توجد طلبات
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {activeTab === 0 ? 'لم تقم بتقديم أي طلبات إجازة حتى الآن' : 'لم تقم بتقديم أي طلبات إذن حتى الآن'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenDialog(true)}
                sx={{ mt: 2 }}
              >
                تقديم طلب جديد
              </Button>
            </Card>
          )}
        </Box>
      )}

      {/* ديالوج إضافة طلب جديد */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            تقديم طلب جديد
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="نوع الطلب"
                value={formData.request_type}
                onChange={(e) => handleRequestTypeChange(e.target.value)}
              >
                <MenuItem value="إجازة">إجازة</MenuItem>
                <MenuItem value="إذن">إذن</MenuItem>
              </TextField>
            </Grid>
            
            {formData.request_type === 'إجازة' && (
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="نوع الإجازة"
                  value={formData.vacation_type}
                  onChange={(e) => setFormData({...formData, vacation_type: e.target.value})}
                >
                  <MenuItem value="سنوية">إجازة سنوية</MenuItem>
                  <MenuItem value="مرضية">إجازة مرضية</MenuItem>
                  <MenuItem value="طارئة">إجازة طارئة</MenuItem>
                  <MenuItem value="أخرى">إجازة أخرى</MenuItem>
                </TextField>
              </Grid>
            )}
            
            {formData.request_type === 'إذن' && (
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="نوع الإذن"
                  value={formData.permission_type}
                  onChange={(e) => setFormData({...formData, permission_type: e.target.value})}
                >
                  <MenuItem value="شخصي">إذن شخصي</MenuItem>
                  <MenuItem value="مرضي">إذن مرضي</MenuItem>
                  <MenuItem value="رسمي">إذن رسمي</MenuItem>
                  <MenuItem value="أخرى">إذن آخر</MenuItem>
                </TextField>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تاريخ ووقت البداية"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تاريخ ووقت النهاية"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="السبب"
                multiline
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="يرجى كتابة سبب الطلب بالتفصيل..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ border: '1px dashed', borderColor: 'grey.400', p: 2, borderRadius: 1 }}>
                <input
                  type="file"
                  accept="*/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    component="span"
                    startIcon={<AttachFile />}
                    variant="outlined"
                  >
                    اختر ملف مرفق (اختياري)
                  </Button>
                </label>
                {fileName && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="success.main">
                      ✓ {fileName}
                    </Typography>
                  </Box>
                )}
                {!fileName && (
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1, display: 'block', mt: 1 }}>
                    اختياري - إذا لم تختار ملف، سيتم إنشاء ملف وهمي تلقائياً
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{ backgroundColor: COLOR_SCHEME.primary }}
            disabled={submitting || !formData.start_date || !formData.end_date || !formData.reason || 
                     (formData.request_type === 'إجازة' && !formData.vacation_type) ||
                     (formData.request_type === 'إذن' && !formData.permission_type)}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'جاري الإرسال...' : 'تقديم الطلب'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ديالوج تفاصيل الطلب */}
      <Dialog open={detailsDialog.open} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            تفاصيل الطلب
          </Typography>
        </DialogTitle>
        <DialogContent>
          {detailsDialog.request && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: alpha(getStatusColor(detailsDialog.request.status), 0.1),
                  color: getStatusColor(detailsDialog.request.status),
                  width: 48,
                  height: 48,
                  mr: 2
                }}>
                  {detailsDialog.request.request_type === 'إجازة' ? <BeachAccess /> : <Schedule />}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {getFullRequestType(detailsDialog.request)}
                  </Typography>
                  <Chip 
                    label={getStatusText(detailsDialog.request.status)}
                    sx={{ 
                      backgroundColor: alpha(getStatusColor(detailsDialog.request.status), 0.1),
                      color: getStatusColor(detailsDialog.request.status),
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    تاريخ ووقت البداية:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateTime(detailsDialog.request.start_date)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    تاريخ ووقت النهاية:
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
                    {formatDuration(detailsDialog.request)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    تاريخ الإنشاء:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatDateTime(detailsDialog.request.created_at)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    السبب:
                  </Typography>
                  <Typography variant="body1" sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                    {detailsDialog.request.reason}
                  </Typography>
                </Grid>
                
                {detailsDialog.request.attached_file && 
                 !isFakeFile(detailsDialog.request.attached_file) && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      الملف المرفق:
                    </Typography>
                    <Button
                      startIcon={<Download />}
                      onClick={() => handleDownloadFile(detailsDialog.request.file_url)}
                      variant="outlined"
                      size="small"
                    >
                      تحميل الملف
                    </Button>
                  </Grid>
                )}
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
    </motion.div>
  );
};

export default VacationsTab;