import * as uiLayout from './common/uiLayout';
import React, { useEffect, useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { CircularProgress } from '@mui/material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Checkbox,
  ListItemText,
  Select,
  OutlinedInput,
  Box,
  Button,
  FormControl,
  InputLabel,
  Typography,
  DialogActions,
  Paper,
  Avatar,
  Chip,
  Divider,
  Tooltip,
  IconButton,
  Grid,
  FormHelperText,
  FormGroup,
  FormControlLabel,
  InputAdornment,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  Description as DescriptionIcon,
  Schedule as ScheduleIcon,
  Groups as GroupsIcon,
  Work as WorkIcon,
  Business as DepartmentIcon,
  Person as PersonIcon,
  FilePresent as FileIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Color palette based on #80b49e
const colorPalette = {
  primary: '#80b49e',
  primaryLight: '#a8c9bb',
  primaryDark: '#5a8f7a',
  primaryLighter: '#e1efe9',
  textDark: '#2d4a3e',
  textLight: '#5a7a6a',
  background: '#f8fbf9',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};

const jobTitles = [
  "رئيس الشركة",                 // 0
  "المدير التنفيذي",             // 1
  "المشرف العام",                // 2
  "مدير إدارة الدعم الفني",       // 3
  "مدير ادارة الحسابات",          // 4
  "مدير ادارة المبيعات",          // 5
  "مدير ادارة الموارد البشرية",   // 6
  "مدير اداري",                  // 7
  "مساعد اداري",                 // 8
  "مشرف فرع",                    // 9
  "مراجع حسابات",                // 10
  "اخصائي موارد بشرية",           // 11
  "مشرف فرع",                    // 12 - Legacy
  "مساعد مشرف",                  // 13
  "مدرب",                        // 14
  "مسئول تحصيل",                 // 15
  "استقبال",                     // 16
  "موظف خدمة عملاء",              // 17
  "موظف مبيعات"                  // 18
];

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(3),
    padding: 0,
    width: 'min(820px, calc(100vw - 32px))',
    maxWidth: '820px',
    minWidth: 0,
    maxHeight: '90dvh',
    boxShadow: theme.shadows[10],
    background: colorPalette.background,
    overflow: 'hidden',

    [theme.breakpoints.down('md')]: {
      width: 'calc(100vw - 24px)',
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: '88dvh',
      margin: 12,
      borderRadius: 14,
    },

    [theme.breakpoints.down('sm')]: {
      width: 'calc(100vw - 12px)',
      maxWidth: 'calc(100vw - 12px)',
      maxHeight: '90dvh',
      margin: 6,
      borderRadius: 12,
    },
  }
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${colorPalette.primaryLighter}`,
  background: `linear-gradient(135deg, ${colorPalette.primary}, ${colorPalette.primaryDark})`,
  color: 'white',

  '& .MuiTypography-root': {
    fontWeight: 700,
    fontSize: '1.05rem',
    fontFamily: '"Cairo", sans-serif'
  },

  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.2, 1.6),

    '& .MuiTypography-root': {
      fontSize: '0.86rem',
    },

    '& .MuiSvgIcon-root': {
      fontSize: '1.15rem',
    },
  },

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.9, 1.1),

    '& .MuiTypography-root': {
      fontSize: '0.74rem',
      lineHeight: 1.35,
    },

    '& .MuiIconButton-root': {
      width: 30,
      height: 30,
    },

    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  color: colorPalette.textDark,
  fontWeight: 700,
  fontSize: '0.92rem',
  fontFamily: '"Cairo", sans-serif',

  [theme.breakpoints.down('md')]: {
    marginTop: theme.spacing(1.2),
    marginBottom: theme.spacing(0.7),
    gap: theme.spacing(0.6),
    fontSize: '0.76rem',

    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
  },

  [theme.breakpoints.down('sm')]: {
    marginTop: theme.spacing(0.9),
    marginBottom: theme.spacing(0.5),
    fontSize: '0.66rem',

    '& .MuiSvgIcon-root': {
      fontSize: '0.9rem',
    },
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: colorPalette.primary,
      borderWidth: 1
    }
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: colorPalette.primary
  }
}));

const FileUploadButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: colorPalette.primary,
  color: 'white',
  fontFamily: '"Cairo", sans-serif',
  '&:hover': {
    backgroundColor: colorPalette.primaryDark
  }
}));

const UserChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: theme.spacing(0.5),
  fontFamily: '"Cairo", sans-serif',
  backgroundColor: colorPalette.primaryLighter,
  color: colorPalette.textDark,
  border: `1px solid ${colorPalette.primaryLight}`,
  '& .MuiChip-avatar': {
    backgroundColor: colorPalette.primary,
    color: 'white'
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontFamily: '"Cairo", sans-serif',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: colorPalette.primaryLight
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: colorPalette.primary,
    borderWidth: 1
  }
}));

const FormSection = styled(Box)(({ theme }) => ({
  backgroundColor: colorPalette.primaryLighter,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: `1px solid ${colorPalette.primaryLight}`,

  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1.1),
    marginBottom: theme.spacing(1.1),
  },

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.75),
    marginBottom: theme.spacing(0.75),
    borderRadius: 8,
  },
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  borderBottom: `1px solid ${colorPalette.primaryLighter}`,
  backgroundColor: colorPalette.background,

  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.6, 0.8),
  },
}));

const UsersCountBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -10,
    top: -5,
    backgroundColor: colorPalette.primary,
    color: 'white',
    fontWeight: 'bold',
    fontFamily: '"Cairo", sans-serif'
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  fontFamily: '"Cairo", sans-serif',
  fontWeight: 600,
  borderRadius: '8px',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${colorPalette.primary}30`
  }
}));

export default function PublicTaskDialog({
  open,
  onClose,
  mainTaskName,
  setMainTaskName,
  mainTaskTime,
  setMainTaskTime,
  taskUsers,
  handleTaskUsersChange,
  disabled,
  isEditMode = false,
  taskToEdit = null
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDept, setSelectedDept] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [mainTaskDesc, setMainTaskDesc] = useState("");
  const [attachFile, setAttachFile] = useState(null);
  const [allowAttach, setAllowAttach] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [existingAttachment, setExistingAttachment] = useState(null);

  useEffect(() => {
    setLoadingDepts(true);
    fetch("https://api3.sstli.com/api/Department/Load")
    .then(res => res.json())
    .then(data => {
      // تصفية البيانات لاستبعاد قسم إدارة الدعم الفني
      const filteredDepartments = data.filter(
        dept => dept.guid !== "de110cb9-b040-4af0-b303-4e57da831ba0"
      );
      setDepartments(filteredDepartments);
    })
    .finally(() => setLoadingDepts(false));

    setLoadingUsers(true);
    fetch("https://api1.sstli.com/api/userinfo")
      .then(res => res.json())
      .then(data => setUsers(data))
      .finally(() => setLoadingUsers(false));

    // إذا كان في وضع التعديل، قم بتحميل بيانات المهمة
    if (isEditMode && taskToEdit) {
      setMainTaskName(taskToEdit.taskName);
      setMainTaskDesc(taskToEdit.taskDescription);
      setMainTaskTime(taskToEdit.taskTimeInMinutes);
      setAllowAttach(taskToEdit.allowAttach);
      
      if (taskToEdit.attachmentPath) {
        setExistingAttachment({
          name: taskToEdit.attachmentPath.split('\\').pop(),
          path: taskToEdit.attachmentPath
        });
      }

      // تحميل المستخدمين المحددين مسبقاً
      try {
        const assignedTo = JSON.parse(taskToEdit.assignedTo.replace(/\\/g, '') || '[]');
        const selectedUserGuids = assignedTo.map(user => user.guid);
        handleTaskUsersChange("default", selectedUserGuids);
        
        // تحديد الأقسام والوظائف بناءً على المستخدمين المحددين
        if (assignedTo.length > 0) {
          const userDepts = [...new Set(assignedTo.map(user => user.departGuid))];
          setSelectedDept(userDepts);
          
          const userJobs = [...new Set(assignedTo.map(user => user.userJop))];
          setSelectedJobs(userJobs);
        }
      } catch (error) {
        console.error("Error parsing assigned users:", error);
      }
    }
  }, [isEditMode, taskToEdit]);

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    if (!Array.isArray(selectedDept) || selectedDept.length === 0) return [];
    
    // Filter by selected departments
    let result = users.filter(u => selectedDept.includes(u.departGuid));
    
    // Filter by selected jobs if any selected (and not "all")
    if (selectedJobs.length > 0 && !selectedJobs.includes("all")) {
      result = result.filter(u => selectedJobs.includes(u.userJop));
    }
    
    // Apply search filter if search term exists
    if (searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(u => {
        const userName = (u.fullName || "").toString().toLowerCase();
        const userJob = (jobTitles[u.userJop] || "").toString().toLowerCase();
        return userName.includes(term) || userJob.includes(term);
      });
    }
    
    // Sort results alphabetically
    return result.sort((a, b) => {
      const nameA = (a.fullName || "").toString().toLowerCase();
      const nameB = (b.fullName || "").toString().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users, selectedDept, selectedJobs, searchTerm]);

  const filteredJobs = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) return [];
    if (!Array.isArray(selectedDept) || selectedDept.length === 0) return [];
    
    const deptUsers = users.filter(u => selectedDept.includes(u.departGuid));
    
    // Get unique job IDs from the filtered users
    const uniqueJobs = [...new Set(deptUsers.map(u => u.userJop))];
    
    // Filter out invalid job IDs and sort them
    return uniqueJobs
      .filter(j => typeof j === 'number' && j >= 0 && j < jobTitles.length)
      .sort((a, b) => a - b);
  }, [users, selectedDept]);

const handleSubmit = async () => {
  setSubmitting(true);
  
  try {
    console.log("بدء عملية إرسال المهمة...");
    
    // التحقق من البيانات الأساسية
    if (!mainTaskName || mainTaskName.trim() === "") {
      throw new Error("اسم المهمة مطلوب");
    }
    
    if (!mainTaskTime || mainTaskTime <= 0) {
      throw new Error("وقت المهمة يجب أن يكون أكبر من الصفر");
    }

    const selectedUserGuids = taskUsers["default"] || [];
    console.log("المستخدمون المحددون:", selectedUserGuids);

    let finalSelectedUsers = [];

    if (selectedUserGuids.includes("all")) {
      console.log("تم اختيار جميع المستخدمين");
      finalSelectedUsers = filteredUsers.map(u => ({
        guid: u.guid,
        fullName: u.fullName
      }));
    } else {
      finalSelectedUsers = filteredUsers
        .filter(u => selectedUserGuids.includes(u.guid))
        .map(u => ({
          guid: u.guid,
          fullName: u.fullName
        }));
    }
    
    console.log("المستخدمون النهائيون:", finalSelectedUsers);
    
    if (finalSelectedUsers.length === 0) {
      throw new Error("يجب اختيار مستخدم واحد على الأقل");
    }

    // التحقق من بيانات المستخدم في localStorage
    const userDataStr = localStorage.getItem("user");
    if (!userDataStr) {
      throw new Error("بيانات المستخدم غير موجودة، يرجى تسجيل الدخول مرة أخرى");
    }
    
    let userData;
    try {
      userData = JSON.parse(userDataStr);
    } catch (e) {
      console.error("خطأ في تحليل بيانات المستخدم:", e);
      throw new Error("بيانات المستخدم غير صالحة");
    }
    
    if (!userData.guid || !userData.userName) {
      throw new Error("بيانات المستخدم غير مكتملة");
    }

    const assignedBy = {
      guid: userData.guid,
      fullName: userData.userName
    };

    // التعامل مع المرفقات
    let attachFileName = "";
    if (allowAttach) {
      if (attachFile) {
        console.log("إضافة مرفق جديد:", attachFile.name);
        attachFileName = attachFile.name;
      } else if (existingAttachment && !attachFile) {
        console.log("الاحتفاظ بالمرفق الحالي:", existingAttachment.name);
        attachFileName = existingAttachment.name;
      } else {
        console.log("لا يوجد مرفق");
        attachFileName = "";
      }
    } else {
      console.log("المرفقات غير مسموحة لهذه المهمة");
      attachFileName = "";
    }

    // إضافة معرف المهمة في حالة التعديل
    let taskId = null;
    if (isEditMode && taskToEdit) {
      if (!taskToEdit.id) {
        throw new Error("معرف المهمة غير موجود في بيانات التعديل");
      }
      taskId = taskToEdit.id;
      console.log("وضع التعديل، معرف المهمة:", taskToEdit.id);
    }

    let url, method, requestBody;

    if (isEditMode) {
      // بناء البيانات للتعديل - فقط المهمة الحالية
      const requestData = {
        TaskId: taskId,
        TaskName: mainTaskName,
        TaskDescription: mainTaskDesc || "",
        TaskTimeInMinutes: mainTaskTime,
        AllowAttach: allowAttach,
        AttachFileName: attachFileName,
        AssignedBy: JSON.stringify(assignedBy),
        AssignedTo: JSON.stringify(finalSelectedUsers),
        ModifiedBy: JSON.stringify({
          guid: userData.guid,
          fullName: userData.userName
        }),
        ModificationType: 'UPDATE'
      };

      url = "https://filesregsiteration.sstli.com/tasks/update_task.php";
      method = "POST";
      requestBody = JSON.stringify(requestData);
    } else {
      // بناء البيانات للإضافة
      const formData = new FormData();
      formData.append("taskName", mainTaskName);
      formData.append("taskDescription", mainTaskDesc || "");
      formData.append("taskTimeInMinutes", mainTaskTime);
      formData.append("allowAttach", allowAttach);
      formData.append("assignedBy", JSON.stringify(assignedBy));
      formData.append("selectedUsers", JSON.stringify(finalSelectedUsers));
      formData.append("assignedTo", JSON.stringify(finalSelectedUsers.map(user => user.guid)));

      // إنشاء ملف وهمي اسمه "fake" دائماً
      const fakeFile = new File([""], "fake", { type: "text/plain" });
      
      if (allowAttach && attachFile) {
        formData.append("file", attachFile);
        formData.append("AttachFileName", attachFileName);
      } else {
        formData.append("AttachFileName", "");
        formData.append("file", fakeFile);
      }

      url = "https://api3.sstli.com/api/PuplicTask";
      method = "POST";
      requestBody = formData;
    }

    console.log(`إرسال طلب ${method} إلى: ${url}`);
    console.log("بيانات الطلب:", requestBody);
    
    let response;
    if (isEditMode) {
      // إرسال بيانات التعديل كـ JSON إلى PHP API
      response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody
      });
    } else {
      // إرسال بيانات الإضافة كـ FormData إلى API الأصلي
      response = await fetch(url, {
        method: method,
        body: requestBody
      });
    }

    console.log("تم استلام الاستجابة، الحالة:", response.status, response.statusText);
    
    let result;
    const responseText = await response.text();
    
    try {
      result = responseText ? JSON.parse(responseText) : {};
      console.log("نتيجة الاستجابة:", result);
    } catch (e) {
      console.error("خطأ في تحليل استجابة الخادم:", e);
      console.log("استجابة الخادم الخام:", responseText);
      
      if (response.ok) {
        result = { success: true, message: "تمت العملية بنجاح ولكن الاستجابة غير متوقعة" };
      } else {
        throw new Error(responseText || "استجابة غير صالحة من الخادم");
      }
    }

    if (response.ok) {
      console.log("تمت العملية بنجاح");
      Swal.fire({
        icon: 'success',
        title: isEditMode ? 'تم تعديل المهمة بنجاح!' : 'تم إرسال المهمة بنجاح!',
        text: isEditMode ? 'تم تعديل المهمة بنجاح.' : 'تم إضافة المهمة بنجاح.',
        confirmButtonText: 'تمام',
        customClass: {
          confirmButton: 'swal-confirm-button'
        }
      });
      onClose();
      
      // إعادة تعيين الحقول بعد الإغلاق
      if (!isEditMode) {
        setMainTaskName("");
        setMainTaskDesc("");
        setMainTaskTime(0);
        setSelectedDept([]);
        setSelectedJobs([]);
        setAttachFile(null);
        setAllowAttach(false);
        setExistingAttachment(null);
        handleTaskUsersChange("default", []);
      }
    } else {
      console.error("خطأ من الخادم:", result);
      const errorMessage = result.message || 
                          result.errors?.file?.[0] || 
                          result.title || 
                          result.error ||
                          `خطأ من الخادم: ${response.status}`;
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("حدث خطأ أثناء معالجة الطلب:", error);
    
    Swal.fire({
      icon: 'error',
      title: 'حدث خطأ!',
      text: error.message || `لم تتم ${isEditMode ? 'تعديل' : 'إضافة'} المهمة: حدث خطأ غير متوقع`,
      confirmButtonText: 'أغلق'
    });
  } finally {
    console.log("إنهاء عملية الإرسال");
    setSubmitting(false);
  }
};

  const isFormValid = mainTaskName && mainTaskDesc && mainTaskTime > 0 && selectedDept.length > 0 && selectedJobs.length > 0;

  const handleFileRemove = () => {
    setAttachFile(null);
    setExistingAttachment(null);
  };

  // Calculate selected users count
  const selectedUsersCount = useMemo(() => {
    if (!taskUsers["default"]) return 0;
    if (taskUsers["default"].includes("all")) return filteredUsers.length;
    return taskUsers["default"].length;
  }, [taskUsers, filteredUsers]);

  return (
    <StyledDialog sx={uiLayout.dialogLayoutSx} open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>
        <Box display="flex" alignItems="center">
          <WorkIcon sx={{ marginInlineEnd: 1 }} />
          <Typography variant="h6">
            {isEditMode ? 'تعديل مهمة عامة' : 'إنشاء مهمة عامة'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      
      <DialogContent
        dividers
        sx={{
          p: { xs: 0.75, sm: 1.2, md: 2.2 },
          backgroundColor: colorPalette.background,
          overflowY: 'auto',

          '& .MuiInputBase-root, & .MuiInputLabel-root, & .MuiFormControlLabel-label': {
            fontSize: { xs: "0.75rem", sm: "0.75rem", md: '0.8rem' },
          },

          '& .MuiButton-root': {
            fontSize: { xs: "0.75rem", sm: "0.75rem", md: '0.76rem' },
            minHeight: { xs: 30, sm: 32, md: 36 },
          },

          '& .MuiChip-root': {
            fontSize: { xs: "0.75rem", sm: "0.75rem", md: "0.75rem" },
            height: { xs: 21, sm: 23, md: 26 },
          },

          '& .MuiAvatar-root': {
            width: { xs: 26, sm: 30, md: 34 },
            height: { xs: 26, sm: 30, md: 34 },
            fontSize: { xs: "0.75rem", sm: "0.75rem", md: '0.75rem' },
          },

          '& .MuiSvgIcon-root': {
            fontSize: { xs: '0.95rem', sm: '1.05rem', md: '1.15rem' },
          },
        }}
      >
        <FormSection>
          <SectionTitle>
            <DescriptionIcon sx={{ color: colorPalette.primary }} />
            <span>معلومات المهمة الأساسية</span>
          </SectionTitle>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <StyledTextField InputLabelProps={{shrink:true}} sx={uiLayout.formFieldSx}
                label="اسم المهمة العامة"
                value={mainTaskName}
                onChange={(e) => setMainTaskName(e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                required
                InputProps={{
                  startAdornment: (
                    <WorkIcon sx={{ color: colorPalette.primary, mr: 1 }} />
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledTextField InputLabelProps={{shrink:true}} sx={uiLayout.formFieldSx}
                label="الوقت المخصص (بالساعات)"
                type="number"
                value={mainTaskTime}
                onChange={(e) => setMainTaskTime(Number(e.target.value))}
                fullWidth
                variant="outlined"
                size="small"
                required
                inputProps={{ min: 1 }}
                InputProps={{
                  startAdornment: (
                    <ScheduleIcon sx={{ color: colorPalette.primary, mr: 1 }} />
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <StyledTextField InputLabelProps={{shrink:true}} sx={uiLayout.formFieldSx}
                label="وصف المهمة"
                value={mainTaskDesc}
                onChange={(e) => setMainTaskDesc(e.target.value)}
                multiline
                rows={isPhone ? 2 : isTablet ? 3 : 4}
                fullWidth
                variant="outlined"
                size="small"
                required
                InputProps={{
                  startAdornment: (
                    <DescriptionIcon sx={{ color: colorPalette.primary, mr: 1, alignSelf: 'flex-start', mt: 1 }} />
                  )
                }}
              />
            </Grid>
          </Grid>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <GroupsIcon sx={{ color: colorPalette.primary }} />
            <span>تحديد المستلمين</span>
          </SectionTitle>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>اختر الأقسام</InputLabel>
                <StyledSelect
                  multiple
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedJobs([]);
                  }}
                  input={<OutlinedInput label="اختر الأقسام" />}
                  disabled={loadingDepts}
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {departments
                        .filter(d => selected.includes(d.guid))
                        .map(d => (
                          <Chip 
                            key={d.guid} 
                            label={d.departName} 
                            size="small" 
                            sx={{
                              backgroundColor: colorPalette.primaryLighter,
                              color: colorPalette.textDark,
                              border: `1px solid ${colorPalette.primaryLight}`,
                              fontFamily: '"Cairo", sans-serif'
                            }}
                          />
                        ))}
                    </Box>
                  )}
                  startAdornment={
                    <DepartmentIcon sx={{ color: colorPalette.primary, mr: 1 }} />
                  }
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.guid} value={dept.guid} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      <Checkbox checked={selectedDept.includes(dept.guid)} sx={{ color: colorPalette.primary }} />
                      <ListItemText primary={dept.departName} />
                    </MenuItem>
                  ))}
                </StyledSelect>
              </FormControl>
            </Grid>

            {selectedDept.length > 0 && (
              <Grid item xs={12} md={6}>
                <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                  <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>الوظائف المطلوبة</InputLabel>
                  <StyledSelect
                    multiple
                    value={selectedJobs}
                    onChange={(e) => setSelectedJobs(e.target.value)}
                    input={<OutlinedInput label="الوظائف المطلوبة" />}
                    renderValue={(selected) => (
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {selected.includes("all") ? (
                          <Chip 
                            label="كل الوظائف" 
                            size="small" 
                            sx={{
                              backgroundColor: colorPalette.primary,
                              color: 'white',
                              fontFamily: '"Cairo", sans-serif'
                            }} 
                          />
                        ) : (
                          selected.map(j => (
                            <Chip 
                              key={j} 
                              label={jobTitles[j] || `وظيفة رقم ${j}`} 
                              size="small" 
                              sx={{
                                backgroundColor: colorPalette.primaryLighter,
                                color: colorPalette.textDark,
                                border: `1px solid ${colorPalette.primaryLight}`,
                                fontFamily: '"Cairo", sans-serif'
                              }}
                            />
                          ))
                        )}
                      </Box>
                    )}
                    startAdornment={
                      <WorkIcon sx={{ color: colorPalette.primary, mr: 1 }} />
                    }
                  >
                    <MenuItem value="all" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      <Checkbox checked={selectedJobs.includes("all")} sx={{ color: colorPalette.primary }} />
                      <ListItemText primary="كل الوظائف" />
                    </MenuItem>
                    {filteredJobs.map(job => (
                      <MenuItem key={job} value={job} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                        <Checkbox checked={selectedJobs.includes(job)} sx={{ color: colorPalette.primary }} />
                        <ListItemText 
                          primary={`${jobTitles[job] || `وظيفة رقم ${job}`} (${users.filter(u => u.userJop === job && selectedDept.includes(u.departGuid)).length})`} 
                        />
                      </MenuItem>
                    ))}
                  </StyledSelect>
                </FormControl>
              </Grid>
            )}

            {selectedJobs.length > 0 && !loadingUsers && (
              <Grid item xs={12}>
                <FormControl sx={uiLayout.formFieldSx} fullWidth size="small">
                  <InputLabel sx={{ fontFamily: '"Cairo", sans-serif' }}>اختر الموظفين</InputLabel>
                  <StyledSelect
                    multiple
                    value={taskUsers["default"] || []}
                    onChange={(e) => handleTaskUsersChange("default", e.target.value)}
                    input={<OutlinedInput label="اختر الموظفين" />}
                    renderValue={(selected) => (
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {selected.includes("all") ? (
                          <Chip 
                            label={`الكل (${filteredUsers.length})`} 
                            size="small" 
                            sx={{
                              backgroundColor: colorPalette.primary,
                              color: 'white',
                              fontFamily: '"Cairo", sans-serif'
                            }} 
                          />
                        ) : (
                          filteredUsers
                            .filter(u => selected.includes(u.guid))
                            .map(u => (
                              <UserChip
                                key={u.guid}
                                label={u.fullName}
                                avatar={<Avatar sx={{ backgroundColor: colorPalette.primary }}>{u.fullName?.charAt(0) || ''}</Avatar>}
                              />
                            ))
                        )}
                      </Box>
                    )}
                    startAdornment={
                      <UsersCountBadge 
                        badgeContent={selectedUsersCount} 
                        sx={{ mr: 1 }}
                      >
                        <PersonIcon sx={{ color: colorPalette.primary }} />
                      </UsersCountBadge>
                    }
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: isPhone ? 260 : isTablet ? 320 : 400
                        }
                      }
                    }}
                  >
                    <SearchContainer>
                      <TextField sx={uiLayout.formFieldSx} InputLabelProps={{ shrink: true }}
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="ابحث عن موظف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: colorPalette.primary }} />
                            </InputAdornment>
                          ),
                          endAdornment: searchTerm && (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => setSearchTerm("")}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </SearchContainer>
                    
                    <MenuItem value="all" sx={{ fontFamily: '"Cairo", sans-serif' }}>
                      <Checkbox checked={(taskUsers["default"] || []).includes("all")} sx={{ color: colorPalette.primary }} />
                      <ListItemText primary={`الكل (${filteredUsers.length})`} />
                    </MenuItem>
                    
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <MenuItem key={user.guid} value={user.guid} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                          <Checkbox checked={(taskUsers["default"] || []).includes(user.guid)} sx={{ color: colorPalette.primary }} />
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar sx={{ 
                              width: 24, 
                              height: 24, 
                              fontSize: '0.75rem',
                              backgroundColor: colorPalette.primary 
                            }}>
                              {user.fullName?.charAt(0) || ''}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontFamily: '"Cairo", sans-serif' }}>{user.fullName || 'غير معروف'}</Typography>
                              <Typography variant="caption" sx={{ color: colorPalette.textLight, fontFamily: '"Cairo", sans-serif' }}>
                                {jobTitles[user.userJop] || `وظيفة رقم ${user.userJop}`}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <Box p={2} textAlign="center">
                        <Typography variant="body2" sx={{ color: colorPalette.textLight, fontFamily: '"Cairo", sans-serif' }}>
                          {searchTerm ? 'لا يوجد موظفين مطابقين للبحث' : 'لا يوجد موظفين متاحين'}
                        </Typography>
                      </Box>
                    )}
                  </StyledSelect>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FileIcon sx={{ color: colorPalette.primary }} />
            <span>إرفاق الملفات</span>
          </SectionTitle>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allowAttach}
                  onChange={(e) => {
                    setAllowAttach(e.target.checked);
                    if (!e.target.checked) {
                      setAttachFile(null);
                      setExistingAttachment(null);
                    }
                  }}
                  sx={{ color: colorPalette.primary }}
                />
              }
              label="السماح بإرفاق ملف"
              sx={{ fontFamily: '"Cairo", sans-serif' }}
            />
            
            {allowAttach && (
              <Box mt={2}>
                {attachFile ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      padding: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      borderRadius: 1,
                      backgroundColor: colorPalette.primaryLighter,
                      border: `1px solid ${colorPalette.primaryLight}`
                    }}
                  >
                    <Box display="flex" alignItems="center" flexGrow={1}>
                      <AttachFileIcon sx={{ color: colorPalette.primary, marginInlineEnd: 2 }} />
                      <Box>
                        <Typography variant="body1" fontWeight={500} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                          {attachFile.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorPalette.textLight, fontFamily: '"Cairo", sans-serif' }}>
                          {(attachFile.size / 1024).toFixed(2)} KB
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title="إزالة الملف">
                      <IconButton 
                        size="small" 
                        onClick={handleFileRemove}
                        sx={{ color: colorPalette.error }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ) : existingAttachment ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      padding: 2, 
                      display: 'flex', 
                      alignItems: 'center',
                      borderRadius: 1,
                      backgroundColor: colorPalette.primaryLighter,
                      border: `1px solid ${colorPalette.primaryLight}`
                    }}
                  >
                    <Box display="flex" alignItems="center" flexGrow={1}>
                      <AttachFileIcon sx={{ color: colorPalette.primary, marginInlineEnd: 2 }} />
                      <Box>
                        <Typography variant="body1" fontWeight={500} sx={{ fontFamily: '"Cairo", sans-serif' }}>
                          {existingAttachment.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorPalette.textLight, fontFamily: '"Cairo", sans-serif' }}>
                          الملف المرفق حالياً
                        </Typography>
                      </Box>
                    </Box>
                    <Tooltip title="إزالة الملف">
                      <IconButton 
                        size="small" 
                        onClick={handleFileRemove}
                        sx={{ color: colorPalette.error }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ) : (
                  <FileUploadButton
                    component="label"
                    startIcon={<AttachFileIcon />}
                    variant="contained"
                    size="medium"
                  >
                    اختر ملف
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) setAttachFile(file);
                      }}
                    />
                  </FileUploadButton>
                )}
                <FormHelperText sx={{ fontFamily: '"Cairo", sans-serif' }}>الحد الأقصى لحجم الملف 5MB</FormHelperText>
              </Box>
            )}
          </FormGroup>
        </FormSection>
      </DialogContent>
      
      <DialogActions sx={uiLayout.withUiSx({ 
        padding: 2, 
        borderTop: `1px solid ${colorPalette.primaryLighter}`,
        backgroundColor: colorPalette.background 
      }, uiLayout.dialogActionsSx)}>
        <StyledButton
          variant="outlined"
          onClick={onClose}
          startIcon={<CloseIcon />}
          disabled={submitting}
          sx={{ 
            borderColor: colorPalette.error,
            color: colorPalette.error,
            '&:hover': {
              borderColor: colorPalette.error,
              backgroundColor: `${colorPalette.error}10`
            }
          }}
        >
          إلغاء
        </StyledButton>
        <StyledButton
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
          startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          sx={{ 
            backgroundColor: colorPalette.primary,
            '&:hover': {
              backgroundColor: colorPalette.primaryDark
            },
            '&:disabled': {
              backgroundColor: colorPalette.textLight
            }
          }}
        >
          {submitting 
            ? isEditMode ? 'جاري التعديل...' : 'جاري الإرسال...' 
            : isEditMode ? 'تعديل المهمة' : 'إنشاء المهمة'}
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
}