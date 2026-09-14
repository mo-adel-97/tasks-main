import * as uiLayout from './common/uiLayout';
import { hrChipSx } from "./hrControlStyles";
// EmployeeProfileDialog.jsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Grid,
  Card,
  Chip,
  Divider,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  Person,
  Business,
  AttachMoney,
  BeachAccess,
  Schedule,
  Download,
  Email,
  Phone,
  CalendarToday,
  Work,
  Security,
  Star,
  Warning,
  CheckCircle,
  AccessTime,
  TrendingUp,
  TrendingDown,
  EventAvailable,
  EventBusy
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { alpha } from '@mui/material/styles';

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

// API URLs
const HR_API_BASE_URL = 'https://filesregsiteration.sstli.com/erp/hr_vacations_permissions.php';

const EmployeeProfileDialog = ({ open, onClose, employee, permissions, userImage, branches = [] }) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [employeeRequests, setEmployeeRequests] = React.useState({
    pending: [],
    approved: []
  });
  const [loadingRequests, setLoadingRequests] = React.useState(false);
  
  // states للفترات الزمنية
  const [attendancePeriod, setAttendancePeriod] = React.useState({
    from: '2024-01-01',
    to: '2024-01-31'
  });
  
  const [salaryPeriod, setSalaryPeriod] = React.useState({
    from: '2024-01-01',
    to: '2024-01-31'
  });

  // جلب طلبات الموظف من API
  const fetchEmployeeRequests = React.useCallback(async () => {
    if (!employee?.guid) return;
    
    setLoadingRequests(true);
    try {
      const response = await fetch(HR_API_BASE_URL);
      const result = await response.json();
      
      if (result.success) {
        // تصفية الطلبات الخاصة بهذا الموظف فقط
        const userRequests = result.data.filter(request => request.user_guid === employee.guid);
        
        const pending = userRequests.filter(request => request.status === 'pending');
        const approved = userRequests.filter(request => request.status === 'approved');
        
        setEmployeeRequests({
          pending: pending.map(req => ({
            type: req.request_type,
            status: 'قيد المراجعة',
            date: req.created_at,
            days: req.total_days,
            hours: req.total_hours,
            reason: req.reason,
            vacation_type: req.vacation_type,
            permission_type: req.permission_type
          })),
          approved: approved.map(req => ({
            type: req.request_type,
            status: 'تم الموافقة',
            date: req.created_at,
            days: req.total_days,
            hours: req.total_hours,
            reason: req.reason,
            vacation_type: req.vacation_type,
            permission_type: req.permission_type
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching employee requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  }, [employee?.guid]);

  React.useEffect(() => {
    if (employee?.guid && open) {
      fetchEmployeeRequests();
    }
  }, [employee?.guid, open, fetchEmployeeRequests]);

  if (!employee) return null;

  // دالة علشان تجيب اسم الفرع من الـ GUID
  const getBranchName = (branchGuid) => {
    if (!branchGuid || branchGuid === '00000000-0000-0000-0000-000000000000') {
      return 'غير متوفر';
    }
    
    const branch = branches.find(b => b.guid === branchGuid);
    return branch ? branch.name : 'غير متوفر';
  };

  // بيانات افتراضية للحضور والانصراف
  const getAttendanceData = (period) => {
    // بيانات افتراضية - في الواقع بتكون جاية من API
    return {
      summary: {
        totalDays: 22,
        presentDays: 18,
        absentDays: 2,
        lateDays: 2,
        earlyLeaveDays: 1,
        averageCheckIn: '08:15',
        averageCheckOut: '17:45'
      },
      details: [
        { date: '2024-01-01', checkIn: '08:00', checkOut: '17:00', status: 'حاضر', late: '0', notes: '' },
        { date: '2024-01-02', checkIn: '08:30', checkOut: '17:30', status: 'متأخر', late: '30', notes: 'ازدحام مروري' },
        { date: '2024-01-03', checkIn: '08:00', checkOut: '16:45', status: 'مبكر', late: '0', notes: 'انصراف مبكر' },
        { date: '2024-01-04', checkIn: '-', checkOut: '-', status: 'غائب', late: '-', notes: 'إجازة مرضية' },
        { date: '2024-01-05', checkIn: '08:00', checkOut: '17:00', status: 'حاضر', late: '0', notes: '' },
      ]
    };
  };

  // بيانات افتراضية للرواتب والمكافآت
  const getSalaryData = (period) => {
    // بيانات افتراضية - في الواقع بتكون جاية من API
    return {
      summary: {
        totalSalary: 25000,
        totalBonuses: 5000,
        totalDeductions: 2000,
        netAmount: 28000,
        currency: 'ج.م'
      },
      details: [
        { month: 'يناير 2024', basic: 5000, allowances: 1500, bonuses: 1000, deductions: 200, net: 7300 },
        { month: 'ديسمبر 2023', basic: 5000, allowances: 1500, bonuses: 1500, deductions: 300, net: 7700 },
        { month: 'نوفمبر 2023', basic: 5000, allowances: 1500, bonuses: 800, deductions: 150, net: 7150 },
        { month: 'أكتوبر 2023', basic: 5000, allowances: 1500, bonuses: 1200, deductions: 250, net: 7450 },
        { month: 'سبتمبر 2023', basic: 5000, allowances: 1500, bonuses: 700, deductions: 100, net: 7100 },
      ]
    };
  };

  // بيانات افتراضية للعرض (تستخدم فقط إذا مفيش بيانات حقيقية)
  const getEmployeeData = () => {
    const userPermissions = permissions || {};
    
    // بيانات افتراضية للعرض
    const defaultPersonalInfo = {
      email: employee.email || `${employee.userName}@company.com`,
      phone: employee.phone || '+201234567890',
      address: 'المنصورة مصر',
      nationalId: '29901010101010',
      birthDate: '1990-01-01'
    };

    const defaultSalaryInfo = {
      basicSalary: 5000,
      allowances: 1500,
      bonuses: 500,
      deductions: 200,
      netSalary: 6800,
      bankAccount: 'EG123456789012345678901234',
      bankName: 'بنك الإنماء',
      salaryPeriod: 'شهري'
    };

    const defaultAttachments = [
      { name: 'صورة شخصية', type: 'image', date: '2024-01-15' },
      { name: 'صورة الهوية', type: 'image', date: '2024-01-15' },
      { name: 'شهادة الخبرة', type: 'image', date: '2024-01-15' },
      { name: 'عقد العمل', type: 'document', date: '2024-01-10' }
    ];

    const defaultPerformance = {
      rating: 4.2,
      lastEvaluation: '2024-01-20',
      achievements: ['موظف الشهر - ديسمبر 2023', 'أفضل أداء في المبيعات']
    };

    return {
      personalInfo: {
        email: userPermissions.email || defaultPersonalInfo.email,
        phone: userPermissions.phone || defaultPersonalInfo.phone,
        address: userPermissions.address || defaultPersonalInfo.address,
        nationalId: userPermissions.nationalId || defaultPersonalInfo.nationalId,
        birthDate: userPermissions.birthDate || defaultPersonalInfo.birthDate
      },
      salaryInfo: {
        basicSalary: userPermissions.basic_salary || defaultSalaryInfo.basicSalary,
        allowances: userPermissions.allowances || defaultSalaryInfo.allowances,
        bonuses: userPermissions.bonuses || defaultSalaryInfo.bonuses,
        deductions: userPermissions.deductions || defaultSalaryInfo.deductions,
        netSalary: userPermissions.net_salary || defaultSalaryInfo.netSalary,
        bankAccount: userPermissions.bank_account || defaultSalaryInfo.bankAccount,
        bankName: userPermissions.bank_name || defaultSalaryInfo.bankName,
        salaryPeriod: userPermissions.salary_period || defaultSalaryInfo.salaryPeriod
      },
      attachments: userPermissions.attachments || defaultAttachments,
      performance: {
        rating: userPermissions.performance_rating || defaultPerformance.rating,
        lastEvaluation: userPermissions.last_evaluation || defaultPerformance.lastEvaluation,
        achievements: userPermissions.achievements || defaultPerformance.achievements
      },
      // استخدام البيانات الحقيقية من API أو البيانات الافتراضية
      pendingRequests: employeeRequests.pending.length > 0 ? employeeRequests.pending : [
        { type: 'إجازة', status: 'قيد المراجعة', date: '2024-01-25', days: 3, reason: 'إجازة سنوية' },
        { type: 'إذن', status: 'معلق', date: '2024-01-20', hours: 2, reason: 'ظرف طارئ' }
      ],
      approvedRequests: employeeRequests.approved.length > 0 ? employeeRequests.approved : [
        { type: 'إجازة', status: 'تم الموافقة', date: '2024-01-15', days: 2, reason: 'إجازة عادية' },
        { type: 'إذن', status: 'تمت الموافقة', date: '2024-01-10', hours: 1, reason: 'مراجعة طبية' }
      ],
      attendance: getAttendanceData(attendancePeriod),
      salaries: getSalaryData(salaryPeriod)
    };
  };

  const employeeData = getEmployeeData();

  const getJobTitle = (jobId) => {
    switch (jobId) {
      case 6: return 'مدير موارد بشرية';
      case 11: return 'موظف موارد بشرية';
      case 14: return 'موظف';
      case 9: return 'مشرف';
      default: return 'موظف';
    }
  };

  const getJobColor = (jobId) => {
    switch (jobId) {
      case 6: return COLOR_SCHEME.primary;
      case 11: return COLOR_SCHEME.accent;
      case 14: return COLOR_SCHEME.info;
      case 9: return COLOR_SCHEME.warning;
      default: return COLOR_SCHEME.text;
    }
  };

  const calculateServiceDuration = (startDate) => {
    if (!startDate) return 'غير محدد';
    
    const start = new Date(startDate);
    const now = new Date();
    
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const parts = [];
    if (years > 0) parts.push(`${years} سنة`);
    if (months > 0) parts.push(`${months} شهر`);
    if (days > 0 || (years === 0 && months === 0)) parts.push(`${days} يوم`);

    return parts.join(' و ') || 'أقل من يوم';
  };

  // دالة لتنسيق الأرقام المالية
  const formatCurrency = (value) => {
    if (!value || value === 'غير متوفر') return 'غير متوفر';
    if (typeof value === 'number') {
      return `${value.toLocaleString()} ج.م`;
    }
    return value;
  };

  // دالة لتنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'غير متوفر') return 'غير محدد';
    try {
      return new Date(dateString).toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  // دالة للحصول على النوع الكامل للطلب
  const getFullRequestType = (request) => {
    if (request.type === 'إجازة') {
      return request.vacation_type ? `إجازة ${request.vacation_type}` : 'إجازة';
    } else {
      return request.permission_type ? `إذن ${request.permission_type}` : 'إذن';
    }
  };

  // دالة للحصول على لون حالة الحضور
  const getAttendanceStatusColor = (status) => {
    switch (status) {
      case 'حاضر': return COLOR_SCHEME.success;
      case 'متأخر': return COLOR_SCHEME.warning;
      case 'مبكر': return COLOR_SCHEME.info;
      case 'غائب': return COLOR_SCHEME.error;
      default: return COLOR_SCHEME.text;
    }
  };

  const InfoCard = ({ title, icon, children, color = COLOR_SCHEME.primary }) => (
    <Card sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(color, 0.2)}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          backgroundColor: alpha(color, 0.1),
          color: color,
          marginInlineEnd: 1
        }}>
          {icon}
        </Box>
        <Typography variant="h6" fontWeight="bold" color={color}>
          {title}
        </Typography>
      </Box>
      {children}
    </Card>
  );

  return (
    <Dialog sx={uiLayout.dialogLayoutSx} open={open} onClose={onClose} maxWidth="lg" fullWidth dir="rtl" PaperProps={{ sx: { textAlign: "start" } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            الملف الشخصي - {employee.fullName}
          </Typography>
          <Button sx={uiLayout.buttonSx} onClick={onClose} variant="outlined">
            إغلاق
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* الهيدر */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ p: 3, mb: 3, background: `linear-gradient(135deg, ${COLOR_SCHEME.primary}15 0%, ${COLOR_SCHEME.accent}15 100%)` }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar
                    src={userImage}
                    sx={{
                      width: 120,
                      height: 120,
                      mb: 2,
                      border: `4px solid ${COLOR_SCHEME.primary}`,
                      bgcolor: getJobColor(employee.userJop)
                    }}
                  >
                    {!userImage && employee.fullName?.charAt(0)}
                  </Avatar>
                  <Chip 
                    label={getJobTitle(employee.userJop)}
                    sx={{ 
                      backgroundColor: alpha(getJobColor(employee.userJop), 0.1),
                      color: getJobColor(employee.userJop),
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={9}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                      {employee.fullName}
                    </Typography>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      {employee.userName}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business color="action" />
                        <Typography variant="body1">
                          {getBranchName(employee.branchForWork)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday color="action" />
                        <Typography variant="body1">
                          مدة العمل: {calculateServiceDuration(permissions?.employment_start_date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Work color="action" />
                        <Typography variant="body1">
                          منذ: {formatDate(permissions?.employment_start_date)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* مؤشرات سريعة */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  <Chip sx={hrChipSx()} 
                    icon={<BeachAccess />} 
                    label={`${permissions?.annual_vacation_max_days || 0} يوم إجازة`}
                    variant="outlined"
                  />
                  <Chip sx={hrChipSx()} 
                    icon={<Schedule />} 
                    label={`${permissions?.permission_max_hours_month || 0} ساعة إذن`}
                    variant="outlined"
                  />
                  <Chip sx={hrChipSx()} 
                    icon={<AttachMoney />} 
                    label={formatCurrency(employeeData.salaryInfo.netSalary)}
                    color="success"
                    variant="outlined"
                  />
                  <Chip sx={hrChipSx()} 
                    icon={<Star />} 
                    label={`تقييم ${employeeData.performance.rating}/5`}
                    color="warning"
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>
          </Card>
        </motion.div>

        {/* التبويبات - مركزة */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': { 
                  fontWeight: 'bold', 
                  minHeight: 60,
                  fontSize: '0.9rem'
                }
              }}
            >
              <Tab icon={<Person />} label="المعلومات الشخصية" />
              <Tab icon={<AccessTime />} label="الحضور والانصراف" />
              <Tab icon={<AttachMoney />} label="الرواتب والمكافآت" />
              <Tab icon={<BeachAccess />} label="الإجازات والإذونات" />
              <Tab icon={<Security />} label="المرفقات" />
              <Tab icon={<Star />} label="الأداء والتقييم" />
            </Tabs>
          </Box>
        </Card>

        {/* محتوى التبويبات */}
        {activeTab === 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoCard title="المعلومات الأساسية" icon={<Person />}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><Email color="action" /></ListItemIcon>
                      <ListItemText primary="البريد الإلكتروني" secondary={<bdi dir="ltr">{employeeData.personalInfo.email}</bdi>} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Phone color="action" /></ListItemIcon>
                      <ListItemText primary="رقم الهاتف" secondary={<bdi dir="ltr">{employeeData.personalInfo.phone}</bdi>} />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Business color="action" /></ListItemIcon>
                      <ListItemText primary="العنوان" secondary={employeeData.personalInfo.address} />
                    </ListItem>
                  </List>
                </InfoCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <InfoCard title="المعلومات الوظيفية" icon={<Work />} color={COLOR_SCHEME.info}>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="رقم الهوية" secondary={<bdi dir="ltr">{employeeData.personalInfo.nationalId}</bdi>} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="تاريخ الميلاد" secondary={formatDate(employeeData.personalInfo.birthDate)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="تاريخ التعيين" secondary={formatDate(permissions?.employment_start_date)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="الفرع" secondary={getBranchName(employee.branchForWork)} />
                    </ListItem>
                  </List>
                </InfoCard>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {activeTab === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <InfoCard title="تقرير الحضور والانصراف" icon={<AccessTime />} color={COLOR_SCHEME.info}>
                  {/* فلترة الفترة */}
                  <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(COLOR_SCHEME.info, 0.05), borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      تحديد الفترة
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <TextField sx={uiLayout.formFieldSx}
                          fullWidth
                          label="من تاريخ"
                          type="date"
                          value={attendancePeriod.from}
                          onChange={(e) => setAttendancePeriod(prev => ({...prev, from: e.target.value}))}
                          InputLabelProps={{ shrink: true }}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField sx={uiLayout.formFieldSx}
                          fullWidth
                          label="إلى تاريخ"
                          type="date"
                          value={attendancePeriod.to}
                          onChange={(e) => setAttendancePeriod(prev => ({...prev, to: e.target.value}))}
                          InputLabelProps={{ shrink: true }}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button sx={uiLayout.buttonSx} variant="contained" fullWidth>
                          تطبيق
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* إحصائيات سريعة */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.success, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.success}>
                          {employeeData.attendance.summary.presentDays}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          أيام حضور
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.error, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.error}>
                          {employeeData.attendance.summary.absentDays}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          أيام غياب
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.warning, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.warning}>
                          {employeeData.attendance.summary.lateDays}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          أيام تأخير
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.info, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.info}>
                          {employeeData.attendance.summary.earlyLeaveDays}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          انصراف مبكر
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.primary, 0.1) }}>
                        <Typography variant="h6" fontWeight="bold" color={COLOR_SCHEME.primary}>
                          {employeeData.attendance.summary.averageCheckIn}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          متوسط الحضور
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* جدول التفاصيل */}
                  <TableContainer sx={uiLayout.tableContainerSx} component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>التاريخ</strong></TableCell>
                          <TableCell><strong>الحضور</strong></TableCell>
                          <TableCell><strong>الانصراف</strong></TableCell>
                          <TableCell><strong>الحالة</strong></TableCell>
                          <TableCell><strong>التأخير (د)</strong></TableCell>
                          <TableCell><strong>ملاحظات</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employeeData.attendance.details.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventAvailable color={record.checkIn !== '-' ? "success" : "disabled"} />
                                {record.checkIn}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventBusy color={record.checkOut !== '-' ? "success" : "disabled"} />
                                {record.checkOut}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={record.status}
                                size="small"
                                sx={{ 
                                  backgroundColor: alpha(getAttendanceStatusColor(record.status), 0.1),
                                  color: getAttendanceStatusColor(record.status)
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {record.late !== '-' && record.late !== '0' ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <TrendingDown color="warning" />
                                  <Typography color="warning.main">
                                    {record.late} د
                                  </Typography>
                                </Box>
                              ) : record.late === '0' ? (
                                <TrendingUp color="success" />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="textSecondary">
                                {record.notes || '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </InfoCard>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {activeTab === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <InfoCard title="الرواتب والمكافآت" icon={<AttachMoney />} color={COLOR_SCHEME.success}>
                  {/* فلترة الفترة */}
                  <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(COLOR_SCHEME.success, 0.05), borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      تحديد الفترة
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <TextField sx={uiLayout.formFieldSx}
                          fullWidth
                          label="من تاريخ"
                          type="date"
                          value={salaryPeriod.from}
                          onChange={(e) => setSalaryPeriod(prev => ({...prev, from: e.target.value}))}
                          InputLabelProps={{ shrink: true }}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField sx={uiLayout.formFieldSx}
                          fullWidth
                          label="إلى تاريخ"
                          type="date"
                          value={salaryPeriod.to}
                          onChange={(e) => setSalaryPeriod(prev => ({...prev, to: e.target.value}))}
                          InputLabelProps={{ shrink: true }}
                         inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button sx={uiLayout.buttonSx} variant="contained" fullWidth>
                          تطبيق
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* إحصائيات سريعة */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.success, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.success}>
                          {formatCurrency(employeeData.salaries.summary.netAmount)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          إجمالي الصافي
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.primary, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.primary}>
                          {formatCurrency(employeeData.salaries.summary.totalSalary)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          إجمالي الرواتب
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.warning, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.warning}>
                          {formatCurrency(employeeData.salaries.summary.totalBonuses)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          إجمالي المكافآت
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ textAlign: 'center', p: 2, backgroundColor: alpha(COLOR_SCHEME.error, 0.1) }}>
                        <Typography variant="h4" fontWeight="bold" color={COLOR_SCHEME.error}>
                          {formatCurrency(employeeData.salaries.summary.totalDeductions)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          إجمالي الخصومات
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* جدول التفاصيل */}
                  <TableContainer sx={uiLayout.tableContainerSx} component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>الشهر</strong></TableCell>
                          <TableCell><strong>الراتب الأساسي</strong></TableCell>
                          <TableCell><strong>البدلات</strong></TableCell>
                          <TableCell><strong>المكافآت</strong></TableCell>
                          <TableCell><strong>الخصومات</strong></TableCell>
                          <TableCell><strong>الصافي</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employeeData.salaries.details.map((salary, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography fontWeight="bold">{salary.month}</Typography>
                            </TableCell>
                            <TableCell>{formatCurrency(salary.basic)}</TableCell>
                            <TableCell>{formatCurrency(salary.allowances)}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUp color="success" />
                                {formatCurrency(salary.bonuses)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingDown color="error" />
                                {formatCurrency(salary.deductions)}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography fontWeight="bold" color={COLOR_SCHEME.success}>
                                {formatCurrency(salary.net)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </InfoCard>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {/* باقي التبويبات (الإجازات والإذونات، المرفقات، الأداء) تبقى كما هي */}
        {activeTab === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoCard title="الصلاحيات الحالية" icon={<Security />}>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="الإجازات السنوية" 
                        secondary={`${permissions?.annual_vacation_max_days || 0} يوم`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="الإجازات المرضية" 
                        secondary={`${permissions?.sick_leave_max_days || 0} يوم`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="الإذونات الشهرية" 
                        secondary={`${permissions?.permission_max_hours_month || 0} ساعة`} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="الإجازات الطارئة" 
                        secondary={`${permissions?.emergency_leave_max_days_month || 0} يوم/شهري`} 
                      />
                    </ListItem>
                  </List>
                </InfoCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <InfoCard title="الطلبات المعلقة" icon={<Warning />} color={COLOR_SCHEME.warning}>
                  {loadingRequests ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : employeeData.pendingRequests.length > 0 ? (
                    <List dense>
                      {employeeData.pendingRequests.map((request, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {request.type === 'إجازة' ? <BeachAccess /> : <Schedule />}
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${getFullRequestType(request)} - ${request.status}`}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {formatDate(request.date)} - 
                                  {request.type === 'إجازة' ? `${request.days} أيام` : `${request.hours} ساعات`}
                                </Typography>
                                {request.reason && (
                                  <Typography variant="caption" color="textSecondary">
                                    {request.reason}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                      لا توجد طلبات معلقة
                    </Typography>
                  )}
                </InfoCard>

                <InfoCard title="الطلبات المتفق عليها" icon={<CheckCircle />} color={COLOR_SCHEME.success}>
                  {loadingRequests ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : employeeData.approvedRequests.length > 0 ? (
                    <List dense>
                      {employeeData.approvedRequests.map((request, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${getFullRequestType(request)} - تم الموافقة`}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {formatDate(request.date)} - 
                                  {request.type === 'إجازة' ? `${request.days} أيام` : `${request.hours} ساعات`}
                                </Typography>
                                {request.reason && (
                                  <Typography variant="caption" color="textSecondary">
                                    {request.reason}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                      لا توجد طلبات تمت الموافقة عليها
                    </Typography>
                  )}
                </InfoCard>
              </Grid>
            </Grid>
          </motion.div>
        )}

        {activeTab === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InfoCard title="المرفقات" icon={<Security />}>
              {employeeData.attachments.length > 0 ? (
                <Grid container spacing={2}>
                  {employeeData.attachments.map((file, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {file.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(file.date)}
                            </Typography>
                          </Box>
                          <Tooltip title="تحميل">
                            <IconButton size="small">
                              <Download />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                  لا توجد مرفقات
                </Typography>
              )}
            </InfoCard>
          </motion.div>
        )}

        {activeTab === 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoCard title="التقييم الحالي" icon={<Star />} color={COLOR_SCHEME.warning}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h3" fontWeight="bold" color={COLOR_SCHEME.warning}>
                      {employeeData.performance.rating}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      من 5.0
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(employeeData.performance.rating / 5) * 100} 
                      sx={{ mt: 2, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      آخر تقييم: {formatDate(employeeData.performance.lastEvaluation)}
                    </Typography>
                  </Box>
                </InfoCard>
              </Grid>

              <Grid item xs={12} md={6}>
                <InfoCard title="الإنتاجية الأسبوعية" icon={<Star />} color={COLOR_SCHEME.success}>
                  {employeeData.performance.achievements.length > 0 ? (
                    <List dense>
                      {employeeData.performance.achievements.map((achievement, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Star color="success" />
                          </ListItemIcon>
                          <ListItemText primary={achievement} />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                      لا توجد إنجازات مسجلة
                    </Typography>
                  )}
                </InfoCard>
              </Grid>
            </Grid>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeProfileDialog;